import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/dbConnect';
import mongoose from 'mongoose';
import { HfInference } from '@huggingface/inference';
import { FeatureExtractionOutput } from '@huggingface/inference';
import UserSubmission from '@/models/UserSubmissions';


const DEBUG = process.env.DEBUG_CODEBERT === 'true';
const hf = new HfInference(process.env.HUGGINGFACE_API_KEY || '');

const embeddingCache = new Map<string, number[]>();

interface SnippetInfo {
  learner_id: string;
  fileName: string;
  code: string;
  timestamp: string;
}


class CodeAnalyzer {
  private static readonly SIMILARITY_THRESHOLD = 0.7;

  public static calculateFallbackSimilarity(code1: string, code2: string): number {
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

  public static generateCacheKey(code: string): string {
    const preprocessed = this.preprocessCode(code);
    return Buffer.from(preprocessed).toString('base64');
  }

  public static async getEmbedding(code: string, cacheKey: string): Promise<number[]> {
    // Implementation remains the same as original
    const cachedValue = embeddingCache.get(cacheKey);
    if (cachedValue) return cachedValue;

    try {
      const embedding = await this.fetchEmbedding(code);
      embeddingCache.set(cacheKey, embedding);
      if (embeddingCache.size > 1000) {
        const firstKey = embeddingCache.keys().next().value;
        if (firstKey !== undefined) {
          embeddingCache.delete(firstKey);
        }
      }
      return embedding;
    } catch (error) {
      if (DEBUG) console.log('Embedding fetch failed:', error);
      return [];
    }
  }

  private static async fetchEmbedding(code: string): Promise<number[]> {
    const preprocessed = this.preprocessCode(code);
    console.log('Preprocessed code length:', preprocessed.length);

    try {
      console.log('Calling HuggingFace API...');
      const output = await hf.featureExtraction({
        model: 'microsoft/codebert-base',
        inputs: preprocessed,
        options: {
          wait_for_model: true,
          output_hidden_states: true
        }
      });
      console.log('HF API response type:', typeof output, 'Array?:', Array.isArray(output));

      return this.applyMeanPooling(output);
    } catch (error) {
      console.error('HF API call failed:', {
        error,
        codeLength: code.length,
        preprocessedLength: preprocessed.length
      });
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
    console.log('Starting similarity analysis for codes:', {
      code1Length: code1.length,
      code2Length: code2.length
    });

    try {
      const cache1 = this.generateCacheKey(code1);
      const cache2 = this.generateCacheKey(code2);
      console.log('Generated cache keys:', { cache1, cache2 });

      const [emb1, emb2] = await Promise.all([
        this.getEmbedding(code1, cache1),
        this.getEmbedding(code2, cache2)
      ]);

      console.log('Embeddings received:', {
        emb1Length: emb1.length,
        emb2Length: emb2.length,
        emb1Sample: emb1.slice(0, 3),
        emb2Sample: emb2.slice(0, 3)
      });

      if (!emb1.length || !emb2.length) {
        console.warn('Invalid embeddings - falling back to basic similarity');
        return this.calculateFallbackSimilarity(code1, code2);
      }

      const similarity = this.calculateCosineSimilarity(emb1, emb2);
      console.log('Calculated similarity:', similarity);

      if (isNaN(similarity) || similarity === null) {
        console.warn('Invalid similarity score - falling back to basic similarity');
        return this.calculateFallbackSimilarity(code1, code2);
      }

      const finalScore = (similarity + 1) / 2;
      console.log('Final normalized score:', finalScore);
      return finalScore;
    } catch (error) {
      console.error('CodeBERT error:', error);
      return this.calculateFallbackSimilarity(code1, code2);
    }
  }

  public static calculateCosineSimilarity(vec1: number[], vec2: number[]): number {
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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const problemId = searchParams.get('problemId');
  const roomId = searchParams.get('roomId');

  console.log('Processing request:', { problemId, roomId });

  if (!problemId && !roomId) {
    console.warn('Missing required parameters');
    return NextResponse.json({
      success: false,
      message: 'No problemId or roomId provided'
    }, { status: 400 });
  }

  try {
    await dbConnect();
    console.log('Database connected');

    const query: { [key: string]: any } = { verdict: "ACCEPTED" };

    if (problemId) {
      query.problem = problemId;
    }

    if (roomId) {
      query.room = roomId;
    }

    const snippets = await UserSubmission.find(query).lean();
    console.log('Found snippets:', snippets.length);

    if (snippets.length === 0) {
      console.log('No snippets found for query:', { problemId, roomId });
      return NextResponse.json({
        success: true,
        matrix: [],
        snippets: [],
        message: 'No snippets found for this problem and room'
      });
    }

    // Log the start of embedding computation
    console.log('Starting embedding computation for', snippets.length, 'snippets');

    const codes = snippets.map(s => s.code);
    const cacheKeys = codes.map(code => CodeAnalyzer.generateCacheKey(code));

    // Track embedding progress
    let completedEmbeddings = 0;
    const embeddings = await Promise.all(
      codes.map(async (code, index) => {
        const embedding = await CodeAnalyzer.getEmbedding(code, cacheKeys[index]);
        completedEmbeddings++;
        console.log(`Completed ${completedEmbeddings}/${codes.length} embeddings`);
        return embedding;
      })
    );

    console.log('Computing similarity matrix...');

    // Compute similarity matrix
    const matrix = codes.map((code1, i) =>
      codes.map((code2, j) => {
        if (i === j) return 100; // Self similarity

        const emb1 = embeddings[i];
        const emb2 = embeddings[j];

        // Handle missing embeddings with fallback
        if (!emb1?.length || !emb2?.length) {
          const fallback = CodeAnalyzer.calculateFallbackSimilarity(code1, code2);
          return Math.round(fallback * 100);
        }

        // Calculate cosine similarity
        const similarity = CodeAnalyzer.calculateCosineSimilarity(emb1, emb2);
        const normalized = (similarity + 1) / 2; // Scale to [0, 1]
        return Math.round(normalized * 100);
      })
    );

    // Prepare snippet metadata for frontend
    const snippetInfo: SnippetInfo[] = snippets.map(snippet => ({
      learner_id: snippet.learner_id,
      fileName: `${snippet.learner}_${problemId}.js`,
      code: snippet.code,
      timestamp: snippet.submission_date,
    }));

    return NextResponse.json({
      success: true,
      matrix,
      snippets: snippetInfo
    });

  } catch (error) {
    console.error('Request failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to compute similarity matrix',
      matrix: [],
      snippets: []
    }, { status: 500 });
  }
}