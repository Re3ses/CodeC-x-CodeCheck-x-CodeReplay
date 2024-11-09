//plagiarism/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/dbConnect';
import mongoose from 'mongoose';
import { HfInference } from '@huggingface/inference';

// Add this near the top of your file after imports
const DEBUG = process.env.DEBUG_CODEBERT === 'true';

// Modify the HF initialization with debug logging
let hf: HfInference;
try {
  if (!process.env.HUGGINGFACE_API_KEY) {
    throw new Error('HUGGINGFACE_API_KEY is not set in environment variables');
  }
  hf = new HfInference(process.env.HUGGINGFACE_API_KEY);
  if (DEBUG) {
    console.log('✅ Hugging Face client initialized successfully');
  }
} catch (error) {
  console.error('❌ Failed to initialize Hugging Face client:', error);
  throw error;
}
// Define interface for the expected response
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
  private static readonly API_URL = 'https://api-inference.huggingface.co/pipeline/feature-extraction/microsoft/graphcodebert-base';
  private static readonly MAX_LENGTH = 512;

  private async getEmbeddings(code: string): Promise<number[]> {
    try {
      const preprocessedCode = this.preprocessCode(code);
      
      if (DEBUG) {
        console.log('Getting embeddings for preprocessed code:', {
          length: preprocessedCode.length,
          preview: preprocessedCode.substring(0, 100)
        });
      }

      // First, check if the model is ready
      const response = await fetch(CodeBERTSimilarity.API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: preprocessedCode
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        
        // Check if model is loading
        if (response.status === 503) {
          console.log('Model is loading, waiting and retrying...');
          // Wait for 5 seconds and retry
          await new Promise(resolve => setTimeout(resolve, 5000));
          return this.getEmbeddings(code);
        }
        
        throw new Error(`API call failed with status: ${response.status}, Error: ${errorText}`);
      }

      const result = await response.json();
      
      if (DEBUG) {
        console.log('Raw API response:', {
          resultType: typeof result,
          isArray: Array.isArray(result),
          length: Array.isArray(result) ? result.length : 'N/A',
          sample: result
        });
      }

      // Handle different response formats
      let embeddings: number[];
      
      if (Array.isArray(result)) {
        if (result.length === 0) {
          throw new Error('Empty embedding response');
        }
        
        if (Array.isArray(result[0])) {
          // Response is array of arrays (token embeddings)
          const sumEmbedding = result.reduce((acc, curr) => {
            return acc.map((val, idx) => val + (curr[idx] || 0));
          }, new Array(result[0].length).fill(0));
          
          embeddings = sumEmbedding.map(val => val / result.length);
        } else {
          // Response is a single array (document embedding)
          embeddings = result;
        }
      } else if (typeof result === 'object' && result !== null) {
        // Handle case where response is an object with embeddings
        const embeddingsArray = Object.values(result);
        if (embeddingsArray.length > 0 && Array.isArray(embeddingsArray[0])) {
          embeddings = embeddingsArray[0];
        } else {
          throw new Error('Invalid embedding format in response object');
        }
      } else {
        throw new Error('Unexpected API response format');
      }

      // Validate embeddings
      if (!embeddings.every(val => typeof val === 'number' && !isNaN(val))) {
        throw new Error('Invalid embedding values detected');
      }

      if (DEBUG) {
        console.log('Processed embeddings:', {
          length: embeddings.length,
          sampleValues: embeddings.slice(0, 5),
          hasNonZeroValues: embeddings.some(v => v !== 0)
        });
      }

      return embeddings;

    } catch (error) {
      console.error('❌ Error getting embeddings:', error);
      throw error; // Propagate error instead of returning zero vector
    }
  }

  private preprocessCode(code: string): string {
    // Remove comments and normalize whitespace
    let cleanCode = code
      .replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    // Add space around operators and punctuation
    cleanCode = cleanCode
      .replace(/([{}()[\]<>=+\-*/%&|^!~?:;,.])/g, ' $1 ')
      .replace(/\s+/g, ' ')
      .trim();

    // Ensure the code doesn't exceed max length
    if (cleanCode.length > CodeBERTSimilarity.MAX_LENGTH) {
      cleanCode = cleanCode.substring(0, CodeBERTSimilarity.MAX_LENGTH);
      const lastSpace = cleanCode.lastIndexOf(' ');
      if (lastSpace > CodeBERTSimilarity.MAX_LENGTH * 0.9) {
        cleanCode = cleanCode.substring(0, lastSpace);
      }
    }

    return cleanCode;
  }

  public async calculateSimilarity(code1: string, code2: string): Promise<number> {
    try {
      if (DEBUG) {
        console.log('Starting similarity calculation');
      }

      // Get embeddings with retries
      const getEmbeddingsWithRetry = async (code: string, retries = 3): Promise<number[]> => {
        try {
          return await this.getEmbeddings(code);
        } catch (error) {
          if (retries > 0) {
            console.log(`Retrying embedding calculation. Attempts remaining: ${retries - 1}`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            return getEmbeddingsWithRetry(code, retries - 1);
          }
          throw error;
        }
      };

      // Use the cache
      const cache = EmbeddingCache.getInstance();
      const hash1 = this.hashCode(code1);
      const hash2 = this.hashCode(code2);

      let embedding1 = cache.has(hash1) ? cache.get(hash1)! : await getEmbeddingsWithRetry(code1);
      let embedding2 = cache.has(hash2) ? cache.get(hash2)! : await getEmbeddingsWithRetry(code2);

      // Cache the embeddings
      if (!cache.has(hash1)) cache.set(hash1, embedding1);
      if (!cache.has(hash2)) cache.set(hash2, embedding2);

      const similarity = this.cosineSimilarity(embedding1, embedding2);
      
      if (DEBUG) {
        console.log('Similarity calculation complete:', {
          rawSimilarity: similarity,
          normalizedSimilarity: (similarity + 1) / 2,
          embedding1Sample: embedding1.slice(0, 5),
          embedding2Sample: embedding2.slice(0, 5)
        });
      }

      // Return raw similarity score (between -1 and 1)
      // The calling code will handle normalization if needed
      return similarity;

    } catch (error) {
      console.error('❌ Error calculating similarity:', error);
      throw error; // Propagate error instead of returning 0
    }
  }

  private cosineSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) {
      throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }

    norm1 = Math.sqrt(norm1);
    norm2 = Math.sqrt(norm2);

    if (norm1 === 0 || norm2 === 0) {
      throw new Error('Zero vector detected');
    }

    return dotProduct / (norm1 * norm2);
  }

  private hashCode(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString();
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
      const firstKey = this.cache.keys().next().value ?? '';
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

export async function POST(request: Request): Promise<NextResponse<PlagiarismResponse>> {
  try {
    await dbConnect();
    const { code, problemId, roomId, userId } = await request.json() as PlagiarismRequest;

    if (DEBUG) {
      console.log('Request data:', {
        codeLength: code.length,
        problemId,
        roomId,
        userId
      });
    }

    const otherSnippets = await CodeSnippet.find({
      problemId: problemId,
      roomId: roomId,
      userId: { $ne: userId }
    }).lean();

    const allCodes = [code, ...otherSnippets.map(snippet => snippet.code)];
    const tfidfCalculator = new TFIDFCalculator(allCodes);
    const codebertCalculator = new CodeBERTSimilarity();

    const similarSnippets: SimilarSnippet[] = await Promise.all(
      otherSnippets.map(async snippet => {
        let jaccardScore = 0;
        let tfidfScore = 0;
        let codebertScore = 0;

        try {
          jaccardScore = calculateJaccardSimilarity(code, snippet.code);
        } catch (error) {
          console.error('Error calculating Jaccard similarity:', error);
        }

        try {
          tfidfScore = tfidfCalculator.calculateTFIDF(code, snippet.code);
        } catch (error) {
          console.error('Error calculating TF-IDF similarity:', error);
        }

        try {
          const rawCodebertScore = await codebertCalculator.calculateSimilarity(code, snippet.code);
          codebertScore = (rawCodebertScore + 1) / 2;
        } catch (error) {
          console.error('Error calculating CodeBERT similarity:', error);
          // Use average of other scores if CodeBERT fails
          codebertScore = (jaccardScore + tfidfScore) / 2;
        }

        if (DEBUG) {
          console.log('Individual similarity scores:', {
            jaccard: jaccardScore,
            tfidf: tfidfScore,
            codebert: codebertScore
          });
        }

        // Calculate weighted similarity with proper weights
        const weights = {
          jaccard: 0.5,   // 30% weight for Jaccard
          tfidf: 0.4,     // 30% weight for TF-IDF
          codebert: 0.1   // 40% weight for CodeBERT
        };

        const weightedSimilarity = (
          (jaccardScore * weights.jaccard) +
          (tfidfScore * weights.tfidf) +
          (codebertScore * weights.codebert)
        );

        // Ensure all scores are properly rounded percentages
        const roundedScores = {
          total: Math.round(weightedSimilarity * 100),
          jaccard: Math.round(jaccardScore * 100),
          tfidf: Math.round(tfidfScore * 100),
          codebert: Math.round(codebertScore * 100)
        };

        if (DEBUG) {
          console.log('Weighted calculation:', {
            rawWeighted: weightedSimilarity,
            roundedScores,
            weights
          });
        }

        return {
          userId: snippet.userId,
          similarity: roundedScores.total,
          jaccardScore: roundedScores.jaccard,
          tfidfScore: roundedScores.tfidf,
          codebertScore: roundedScores.codebert,
          timestamp: new Date(snippet.timestamp).toISOString(),
          code: snippet.code,
          fileName: `${snippet.userId}_${snippet.problemId}.js`,
        };
      })
    );

    // Sort by overall weighted similarity
    const sortedSnippets = similarSnippets.sort((a, b) => b.similarity - a.similarity);

    return NextResponse.json({
      success: true,
      similarSnippets: sortedSnippets
    });
  } catch (error) {
    console.error('❌ Error in plagiarism check:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to check plagiarism',
      similarSnippets: []
    }, {
      status: 500
    });
  }
}