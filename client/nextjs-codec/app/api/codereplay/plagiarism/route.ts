import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/dbConnect';
import mongoose from 'mongoose';
import { HfInference } from '@huggingface/inference';
import { FeatureExtractionOutput } from '@huggingface/inference';

const DEBUG = process.env.DEBUG_CODEBERT === 'true';
const hf = new HfInference(process.env.HUGGINGFACE_API_KEY || '');

// Add cache for CodeBERT embeddings
const embeddingCache = new Map<string, number[]>();

interface SimilarSnippet {
  userId: string;
  similarity: number;
  jaccardScore: number;
  tfidfScore: number;
  codebertScore: number;
  timestamp: string;
  code: string;
  fileName: string;
}

const CodeSnippet = mongoose.models.CodeSnippet || 
  mongoose.model('CodeSnippet', new mongoose.Schema({
    code: String,
    timestamp: { type: Date, default: Date.now },
    userId: String,
    submissionId: String,
    roomId: String,
    problemId: String
  }));

class CodeAnalyzer {
  private static tokenize(code: string): string[] {
    return code
      .replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '')
      .replace(/\s+/g, ' ')
      .trim()
      .split(/[\s\(\)\{\}\[\];,.<>~\|\&\+\-\*\/\=\!\?\:\^\%]+/)
      .filter(Boolean);
  }

  static calculateJaccard(code1: string, code2: string): number {
    const tokens1 = new Set(this.tokenize(code1));
    const tokens2 = new Set(this.tokenize(code2));
    const intersection = new Set([...tokens1].filter(x => tokens2.has(x)));
    const union = new Set([...tokens1, ...tokens2]);
    return union.size ? intersection.size / union.size : 0;
  }

  static calculateTFIDF(documents: string[]): (doc1: string, doc2: string) => number {
    const docTokens = documents.map(this.tokenize);
    const vocabulary = new Set(docTokens.flat());
    const idfScores = new Map([...vocabulary].map(term => {
      const docCount = docTokens.filter(tokens => tokens.includes(term)).length;
      return [term, Math.log(documents.length / (1 + docCount))];
    }));

    return (doc1: string, doc2: string) => {
      const getVector = (doc: string) => {
        const tokens = this.tokenize(doc);
        const tf = new Map([...vocabulary].map(term => 
          [term, tokens.filter(t => t === term).length]
        ));
        return [...vocabulary].map(term => (tf.get(term) || 0) * (idfScores.get(term) || 0));
      };

      const vec1 = getVector(doc1);
      const vec2 = getVector(doc2);
      const dotProduct = vec1.reduce((sum, val, i) => sum + val * vec2[i], 0);
      const mag1 = Math.sqrt(vec1.reduce((sum, val) => sum + val * val, 0));
      const mag2 = Math.sqrt(vec2.reduce((sum, val) => sum + val * val, 0));
      return mag1 && mag2 ? dotProduct / (mag1 * mag2) : 0;
    };
  }

  private static calculateFallbackSimilarity(code1: string, code2: string): number {
    const tokens1 = this.tokenize(code1);
    const tokens2 = this.tokenize(code2);
    
    const allTokens = [...new Set([...tokens1, ...tokens2])];
    const getVector = (tokens: string[]) => {
      const freq = new Map();
      tokens.forEach(t => freq.set(t, (freq.get(t) || 0) + 1));
      return allTokens.map(t => (freq.get(t) || 0) / tokens.length);
    };
    
    const vec1 = getVector(tokens1);
    const vec2 = getVector(tokens2);
    
    const dotProduct = vec1.reduce((sum, val, i) => sum + val * vec2[i], 0);
    const mag1 = Math.sqrt(vec1.reduce((sum, val) => sum + val * val, 0));
    const mag2 = Math.sqrt(vec2.reduce((sum, val) => sum + val * val, 0));
    
    return mag1 && mag2 ? dotProduct / (mag1 * mag2) : 0;
  }

  private static generateCacheKey(code: string): string {
    const preprocessed = this.preprocessCode(code);
    return Buffer.from(preprocessed).toString('base64');
  }

  private static async getEmbedding(code: string, cacheKey: string): Promise<number[]> {
    const cachedValue = embeddingCache.get(cacheKey);
    if (cachedValue) {
      return cachedValue;
    }

    try {
      const embedding = await this.fetchEmbedding(code);
      embeddingCache.set(cacheKey, embedding);
      
      // TypeScript-safe cache cleanup
      if (embeddingCache.size > 1000) {
        const firstKey = Array.from(embeddingCache.keys())[0];
        if (firstKey) {
          embeddingCache.delete(firstKey);
        }
      }

      return embedding;
    } catch (error) {
      if (DEBUG) {
        console.log('Embedding fetch failed:', error);
      }
      return [];
    }
  }

  private static async fetchEmbedding(code: string): Promise<number[]> {
    const preprocessed = this.preprocessCode(code);
    
    try {
      const output = await hf.featureExtraction({
        model: 'microsoft/codebert-base',
        inputs: preprocessed
      });

      return this.normalizeEmbedding(output);
    } catch (error) {
      if (DEBUG) {
        console.log('HF API call failed:', error);
      }
      throw error;
    }
  }

  private static normalizeEmbedding(output: FeatureExtractionOutput): number[] {
    if (!output || !Array.isArray(output)) return [];

    let vectors: number[] = [];
    if (Array.isArray(output[0])) {
      vectors = (output as number[][]).reduce((acc, curr) => 
        acc.map((val, idx) => val + curr[idx])
      ).map(val => val / output.length);
    } else {
      vectors = output as number[];
    }

    // Normalize vector before returning
    const magnitude = Math.sqrt(vectors.reduce((sum, val) => sum + val * val, 0));
    return magnitude === 0 ? vectors : vectors.map(val => val / magnitude);
  }

  static async getCodeBERTScore(code1: string, code2: string): Promise<number> {
    try {
      const cache1 = this.generateCacheKey(code1);
      const cache2 = this.generateCacheKey(code2);
      
      const [emb1, emb2] = await Promise.all([
        this.getEmbedding(code1, cache1),
        this.getEmbedding(code2, cache2)
      ]);

      if (!emb1.length || !emb2.length) {
        if (DEBUG) {
          console.log('Invalid embeddings received:', { emb1, emb2 });
        }
        return this.calculateFallbackSimilarity(code1, code2);
      }

      const similarity = this.calculateCosineSimilarity(emb1, emb2);
      
      if (isNaN(similarity) || similarity === null) {
        if (DEBUG) {
          console.log('Invalid similarity score:', similarity);
        }
        return this.calculateFallbackSimilarity(code1, code2);
      }

      return (similarity + 1) / 2;
    } catch (error) {
      console.error('CodeBERT error:', error);
      return this.calculateFallbackSimilarity(code1, code2);
    }
  }

  private static calculateCosineSimilarity(vec1: number[], vec2: number[]): number {
    // Handle different vector lengths by padding the shorter one
    const maxLength = Math.max(vec1.length, vec2.length);
    
    // Create padded versions of vectors
    const padVector = (vec: number[], targetLength: number): number[] => {
      if (vec.length >= targetLength) return vec;
      return [...vec, ...new Array(targetLength - vec.length).fill(0)];
    };

    const paddedVec1 = padVector(vec1, maxLength);
    const paddedVec2 = padVector(vec2, maxLength);

    // Only consider indices where at least one vector has a non-zero value
    const nonZeroPairs = paddedVec1
      .map((v1, i) => [v1, paddedVec2[i]])
      .filter(([v1, v2]) => v1 !== 0 || v2 !== 0);

    if (nonZeroPairs.length === 0) return 0;

    const [dotProduct, mag1Sq, mag2Sq] = nonZeroPairs.reduce(
      ([dot, m1, m2], [v1, v2]) => [
        dot + v1 * v2,
        m1 + v1 * v1,
        m2 + v2 * v2
      ],
      [0, 0, 0]
    );

    const mag1 = Math.sqrt(mag1Sq);
    const mag2 = Math.sqrt(mag2Sq);

    if (mag1 === 0 || mag2 === 0) {
      return 0;
    }

    const similarity = dotProduct / (mag1 * mag2);
    return Math.max(-1, Math.min(1, similarity));
  }

  private static preprocessCode(code: string): string {
    const processed = code
      .replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '')
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s]/g, ' ')
      .trim()
      .toLowerCase();

    if (processed.length > 512) {
      const truncated = processed.substring(0, 509).trim();
      return truncated.substring(0, truncated.lastIndexOf(' ')) + '...';
    }
    
    return processed;
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const { code, problemId, roomId, userId } = await request.json();
    
    const otherSnippets = await CodeSnippet.find({
      problemId,
      roomId,
      userId: { $ne: userId }
    }).lean();

    const calculateTFIDF = CodeAnalyzer.calculateTFIDF([code, ...otherSnippets.map(s => s.code)]);
    
    const similarSnippets: SimilarSnippet[] = await Promise.all(
      otherSnippets.map(async snippet => {
        const weights = {
          jaccard: 0.6,
          tfidf: 0.3,
          codebert: 0.1
        };

        const [jaccardScore, tfidfScore, codebertScore] = [
          CodeAnalyzer.calculateJaccard(code, snippet.code),
          calculateTFIDF(code, snippet.code),
          await CodeAnalyzer.getCodeBERTScore(code, snippet.code)
        ];

        if (DEBUG) {
          console.log('Similarity scores:', {
            jaccard: jaccardScore,
            tfidf: tfidfScore,
            codebert: codebertScore
          });
        }

        const similarity = Math.round(
          (jaccardScore * weights.jaccard + 
           tfidfScore * weights.tfidf + 
           codebertScore * weights.codebert) * 100
        );

        return {
          userId: snippet.userId,
          similarity,
          jaccardScore: Math.round(jaccardScore * 100),
          tfidfScore: Math.round(tfidfScore * 100),
          codebertScore: Math.round(codebertScore * 100),
          timestamp: new Date(snippet.timestamp).toISOString(),
          code: snippet.code,
          fileName: `${snippet.userId}_${problemId}.js`
        };
      })
    );

    return NextResponse.json({
      success: true,
      similarSnippets: similarSnippets.sort((a, b) => b.similarity - a.similarity)
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to check plagiarism',
      similarSnippets: [] 
    }, { status: 500 });
  }
}