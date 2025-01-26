import { NextResponse } from 'next/server';
import dbConnect from '../../../../../lib/dbConnect';
import mongoose from 'mongoose';
import { HfInference } from '@huggingface/inference';
import { FeatureExtractionOutput } from '@huggingface/inference';

const DEBUG = process.env.DEBUG_CODEBERT === 'true';
const hf = new HfInference(process.env.HUGGINGFACE_API_KEY || '');

const embeddingCache = new Map<string, number[]>();

// == REPLACE ==

// Interface for the sequential similarity calculation
interface SequentialSimilarity {
  fromIndex: number;
  toIndex: number;
  similarity: number;
  codebertScore: number;
}

interface SimilarSnippet {
  length?: number;
  userId: string;
  similarity: number;
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


// == REPLACE ==

// interface Submission {
//   _id: string;
//   language_used: string;
//   code: string;
//   history: string[];
//   score: number;
//   score_overall_count: number;
//   verdict: string;
//   learner: string;
//   learner_id: string;
//   problem: string;
//   room: string;
//   attempt_count: number;
//   start_time: number;
//   end_time: number;
//   completion_time: number;
//   most_similar: string | null;
//   submission_date: string;
//   __v: number;
// }


class CodeAnalyzer {
  private static readonly SIMILARITY_THRESHOLD = 0.7;

  private static calculateFallbackSimilarity(code1: string, code2: string): number {
    const tokens1 = code1.split(/\s+/);
    const tokens2 = code2.split(/\s+/);

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
        inputs: preprocessed,
        options: {
          wait_for_model: true,
          output_hidden_states: true
        }
      });

      return this.applyMeanPooling(output);
    } catch (error) {
      if (DEBUG) {
        console.log('HF API call failed:', error);
      }
      throw error;
    }
  }

  private static applyMeanPooling(output: FeatureExtractionOutput): number[] {
    if (!output || !Array.isArray(output)) return [];

    if (Array.isArray(output[0])) {
      const tokenEmbeddings = output as number[][];
      const sumVector = new Array(tokenEmbeddings[0].length).fill(0);

      for (const tokenEmbedding of tokenEmbeddings) {
        for (let i = 0; i < tokenEmbedding.length; i++) {
          sumVector[i] += tokenEmbedding[i];
        }
      }

      const meanVector = sumVector.map(sum => sum / tokenEmbeddings.length);
      const magnitude = Math.sqrt(meanVector.reduce((sum, val) => sum + val * val, 0));
      return magnitude === 0 ? meanVector : meanVector.map(val => val / magnitude);
    }

    const vector = output as number[];
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    return magnitude === 0 ? vector : vector.map(val => val / magnitude);
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
    const maxLength = Math.max(vec1.length, vec2.length);

    const padVector = (vec: number[], targetLength: number): number[] => {
      if (vec.length >= targetLength) return vec;
      return [...vec, ...new Array(targetLength - vec.length).fill(0)];
    };

    const paddedVec1 = padVector(vec1, maxLength);
    const paddedVec2 = padVector(vec2, maxLength);

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
    // Step 1: Whitespace Normalization
    const normalizedWhitespace = code
      .replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '') // Remove comments
      .replace(/\s+/g, ' ')  // Collapse multiple whitespaces
      .replace(/^\s+|\s+$/g, '')  // Trim leading and trailing whitespaces
      .replace(/\n/g, ' ')  // Replace newlines with spaces
      .replace(/\t/g, ' ');  // Replace tabs with spaces
  
    // Step 2: Variable Name Standardization
    const variableStandardization = normalizedWhitespace
      .replace(/\b(let|var|const)\s+(\w+)/g, (match, keyword, varName) => {
        // Replace camelCase and snake_case with a standard format
        const standardizedName = varName
          .replace(/_/g, '')  // Remove underscores
          .replace(/([A-Z])/g, (_, letter) => letter.toLowerCase());  // Convert camelCase to lowercase
        return `${keyword} ${standardizedName}`;
      });
  
    // Step 3: String Literal Uniformity
    const stringUniformity = variableStandardization
      .replace(/(["'])(.*?)\1/g, (match, quote, content) => {
        // Convert all string literals to a single quote representation
        // Escape internal single quotes
        const escapedContent = content.replace(/'/g, "\\'");
        return `'${escapedContent}'`;
      });
  
    // Step 4: Number Format Standardization
    const numberStandardization = stringUniformity
      .replace(/\b0+(\d+)/g, '$1')  // Remove leading zeros from integers
      .replace(/(\d+\.\d*?)0+$/g, '$1')  // Remove trailing zeros from decimals
      .replace(/(\d+)\.0+\b/g, '$1')  // Convert whole number decimals to integers
      .replace(/\b0x([a-fA-F0-9]+)/gi, (match, hex) => parseInt(hex, 16).toString())  // Convert hex to decimal
      .replace(/\b0b([01]+)/gi, (match, binary) => parseInt(binary, 2).toString());  // Convert binary to decimal
  
    // Final processing
    const processed = numberStandardization
      .toLowerCase()  // Convert to lowercase
      .replace(/[^\w\s']/g, ' ')  // Replace non-word characters (except single quotes) with spaces
      .replace(/\s+/g, ' ')  // Collapse multiple spaces again
      .trim();
  
    // Truncate if too long
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
    const { snapshots, problemId, roomId, userId } = await request.json();

    const recentSnapshots = snapshots;

    // Calculate sequential similarities
    const sequentialSimilarities: SequentialSimilarity[] = [];

    for (let i = 0; i < recentSnapshots.length - 1; i++) {
      const currentSnapshot = recentSnapshots[i];
      const nextSnapshot = recentSnapshots[i + 1];

      const codebertScore = await CodeAnalyzer.getCodeBERTScore(
        currentSnapshot.code, 
        nextSnapshot.code
      );

      sequentialSimilarities.push({
        fromIndex: i,
        toIndex: i + 1,
        similarity: Math.round(codebertScore * 100),
        codebertScore: Math.round(codebertScore * 100)
      });
    }

    return NextResponse.json({
      success: true,
      sequentialSimilarities
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to calculate sequential similarities',
      sequentialSimilarities: [] 
    }, { status: 500 });
  }
}