import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/dbConnect';
import mongoose from 'mongoose';
import * as tf from '@tensorflow/tfjs';
import { HfInference } from '@huggingface/inference';

// Initialize Hugging Face client
const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

// Define interface for the expected response
interface SimilarSnippet {
  userId: string;
  similarity: number;
  timestamp: string;
  code: string;
  fileName: string;
}

interface PlagiarismResponse {
  success: boolean;
  similarSnippets: SimilarSnippet[];
  error?: string;
}

// Define interface for the request body
interface PlagiarismRequest {
  code: string;
  problemId: string;
  roomId: string;
  userId: string;
}

const CodeSnippetSchema = new mongoose.Schema({
  code: String,
  timestamp: { type: Date, default: Date.now },
  userId: String,
  submissionId: String,
  roomId: String,
  problemId: String
});

const CodeSnippet = mongoose.models.CodeSnippet || mongoose.model('CodeSnippet', CodeSnippetSchema);

// Custom Code Tokenizer
class CodeTokenizer {
  static tokenize(code: string): string[] {
    return code
      .replace(/\/\/.*$/gm, '') // Remove single-line comments
      .replace(/\/\*[\s\S]*?\*\//gm, '') // Remove multi-line comments
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
      .split(/[\s\(\)\{\}\[\];,.<>~\|\&\+\-\*\/\=\!\?\:\^\%]+/)
      .filter(token => token.length > 0);
  }
}

// TF-IDF Implementation
class TFIDFCalculator {
  private documents: string[];
  private vocabulary: Set<string>;
  private idfScores: Map<string, number>;

  constructor(documents: string[]) {
    this.documents = documents;
    this.vocabulary = new Set();
    this.idfScores = new Map();
    this.processDocuments();
  }

  private processDocuments() {
    // Build vocabulary
    this.documents.forEach(doc => {
      const tokens = CodeTokenizer.tokenize(doc);
      tokens.forEach(token => this.vocabulary.add(token));
    });

    // Calculate IDF scores
    this.vocabulary.forEach(term => {
      const docCount = this.documents.filter(doc => 
        CodeTokenizer.tokenize(doc).includes(term)
      ).length;
      const idf = Math.log(this.documents.length / (1 + docCount));
      this.idfScores.set(term, idf);
    });
  }

  public calculateTFIDF(doc1: string, doc2: string): number {
    const tokens1 = CodeTokenizer.tokenize(doc1);
    const tokens2 = CodeTokenizer.tokenize(doc2);

    // Calculate TF for both documents
    const tf1 = new Map<string, number>();
    const tf2 = new Map<string, number>();

    tokens1.forEach(token => {
      tf1.set(token, (tf1.get(token) || 0) + 1);
    });
    tokens2.forEach(token => {
      tf2.set(token, (tf2.get(token) || 0) + 1);
    });

    // Calculate TF-IDF vectors
    const vector1: number[] = [];
    const vector2: number[] = [];

    this.vocabulary.forEach(term => {
      const tfidf1 = (tf1.get(term) || 0) * (this.idfScores.get(term) || 0);
      const tfidf2 = (tf2.get(term) || 0) * (this.idfScores.get(term) || 0);
      vector1.push(tfidf1);
      vector2.push(tfidf2);
    });

    // Calculate cosine similarity
    return this.cosineSimilarity(vector1, vector2);
  }

  private cosineSimilarity(vec1: number[], vec2: number[]): number {
    const dotProduct = vec1.reduce((sum, val, i) => sum + val * vec2[i], 0);
    const magnitude1 = Math.sqrt(vec1.reduce((sum, val) => sum + val * val, 0));
    const magnitude2 = Math.sqrt(vec2.reduce((sum, val) => sum + val * val, 0));
    return magnitude1 && magnitude2 ? dotProduct / (magnitude1 * magnitude2) : 0;
  }
}

// CodeBERT Implementation
class CodeBERTSimilarity {
  private static readonly MODEL_ID = 'microsoft/codebert-base';
  private static readonly MAX_LENGTH = 512;

  private async getEmbeddings(code: string): Promise<number[]> {
    try {
      // Preprocess code
      const preprocessedCode = this.preprocessCode(code);
      
      // Get embeddings using CodeBERT through Hugging Face API
      const response = await hf.featureExtraction({
        model: CodeBERTSimilarity.MODEL_ID,
        inputs: preprocessedCode,
      });

      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('Error getting CodeBERT embeddings:', error);
      return [];
    }
  }

  private preprocessCode(code: string): string {
    // Remove comments
    let cleanCode = code
      .replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    // Truncate if necessary to meet max length
    if (cleanCode.length > CodeBERTSimilarity.MAX_LENGTH) {
      cleanCode = cleanCode.substring(0, CodeBERTSimilarity.MAX_LENGTH);
    }

    return cleanCode;
  }
  public async calculateSimilarity(code1: string, code2: string): Promise<number> {
    try {
      const [embedding1, embedding2] = await Promise.all([
        this.getEmbeddings(code1),
        this.getEmbeddings(code2)
      ]);

      if (embedding1.length === 0 || embedding2.length === 0) {
        return 0;
      }

      return this.cosineSimilarity(embedding1, embedding2);
    } catch (error) {
      console.error('Error calculating CodeBERT similarity:', error);
      return 0;
    }
  }

  private cosineSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) return 0;

    const dotProduct = vec1.reduce((sum, val, i) => sum + val * vec2[i], 0);
    const magnitude1 = Math.sqrt(vec1.reduce((sum, val) => sum + val * val, 0));
    const magnitude2 = Math.sqrt(vec2.reduce((sum, val) => sum + val * val, 0));

    return magnitude1 && magnitude2 ? dotProduct / (magnitude1 * magnitude2) : 0;
  }
}

// Cache manager for CodeBERT embeddings to improve performance
class EmbeddingCache {
  private static instance: EmbeddingCache;
  private cache: Map<string, number[]>;
  private readonly MAX_CACHE_SIZE = 1000;

  private constructor() {
    this.cache = new Map();
  }

  public static getInstance(): EmbeddingCache {
    if (!EmbeddingCache.instance) {
      EmbeddingCache.instance = new EmbeddingCache();
    }
    return EmbeddingCache.instance;
  }

  public set(key: string, embeddings: number[]): void {
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, embeddings);
  }

  public get(key: string): number[] | undefined {
    return this.cache.get(key);
  }

  public has(key: string): boolean {
    return this.cache.has(key);
  }
}

function calculateJaccardSimilarity(str1: string, str2: string): number {
  // Tokenize the strings into sets of words and symbols
  const tokenize = (str: string) => {
    // Remove comments and clean the code
    const cleanStr = str.replace(/\/\/.*$/gm, '')  // Remove single-line comments
                     .replace(/\/\*[\s\S]*?\*\//gm, '')  // Remove multi-line comments
                     .replace(/\s+/g, ' ')
                     .trim();
    
    // Split into tokens (words, operators, etc.)
    const tokens = cleanStr.match(/[a-zA-Z_]\w*|\d+|\S/g) || [];
    return new Set(tokens);
  };

  const set1 = tokenize(str1);
  const set2 = tokenize(str2);

  // Calculate intersection
  const intersection = new Set([...set1].filter(x => set2.has(x)));

  // Calculate union
  const union = new Set([...set1, ...set2]);

  // Return Jaccard similarity
  return union.size === 0 ? 0 : (intersection.size / union.size);
}

// Modified POST handler with caching
export async function POST(request: Request): Promise<NextResponse<PlagiarismResponse>> {
  try {
    await dbConnect();
    const { code, problemId, roomId, userId } = await request.json() as PlagiarismRequest;

    const otherSnippets = await CodeSnippet.find({
      problemId: problemId,
      roomId: roomId,
      userId: { $ne: userId }
    }).lean();

    // Initialize similarity calculators
    const allCodes = [code, ...otherSnippets.map(snippet => snippet.code)];
    const tfidfCalculator = new TFIDFCalculator(allCodes);
    const codebertCalculator = new CodeBERTSimilarity();
    const embeddingCache = EmbeddingCache.getInstance();

    // Calculate similarities with caching
    const similarSnippets: SimilarSnippet[] = await Promise.all(
      otherSnippets.map(async snippet => {
        // Calculate Jaccard and TF-IDF similarities
        const jaccardScore = calculateJaccardSimilarity(code, snippet.code);
        const tfidfScore = tfidfCalculator.calculateTFIDF(code, snippet.code);

        // Calculate CodeBERT similarity with caching
        const codebertScore = await codebertCalculator.calculateSimilarity(
          code,
          snippet.code
        );

        // Apply weights
        const weightedSimilarity = 
          (jaccardScore * 0.45) +
          (tfidfScore * 0.45) +
          (codebertScore * 0.10);

        return {
          userId: snippet.userId,
          similarity: Math.round(weightedSimilarity * 100),
          timestamp: new Date(snippet.timestamp).toISOString(),
          code: snippet.code,
          fileName: `${snippet.userId}_${snippet.problemId}.js`,
        };
      })
    );

    // Sort by similarity
    const sortedSnippets = similarSnippets.sort((a, b) => b.similarity - a.similarity);

    return NextResponse.json({
      success: true,
      similarSnippets: sortedSnippets
    });
  } catch (error) {
    console.error('Error in plagiarism check:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to check plagiarism',
      similarSnippets: []
    }, {
      status: 500
    });
  }
}

// Environment variable types
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      HUGGINGFACE_API_KEY: string;
    }
  }
}