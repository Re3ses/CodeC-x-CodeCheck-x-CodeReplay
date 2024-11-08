import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/dbConnect';
import mongoose from 'mongoose';

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

    // Log incoming request data
    console.log('Checking plagiarism for:', { problemId, roomId, userId });

    // Find ALL other snippets, not just from a specific user
    const otherSnippets = await CodeSnippet.find({
      problemId: problemId,
      roomId: roomId,
      userId: { $ne: userId } // Exclude the current user's submission
    }).lean();

    console.log(`Found ${otherSnippets.length} snippets to compare`);

    // Calculate similarity for all snippets and format according to expected response
    const similarSnippets: SimilarSnippet[] = otherSnippets
      .map(snippet => ({
        userId: snippet.userId,
        similarity: Math.round(calculateJaccardSimilarity(code, snippet.code) * 100),
        timestamp: new Date(snippet.timestamp).toISOString(),
        code: snippet.code,
        fileName: `${snippet.userId}_${snippet.problemId}.js`,
      }))
      .sort((a, b) => b.similarity - a.similarity);

    console.log(`Processed ${similarSnippets.length} similarity results`);

    // Add all snippets, even with 0% similarity
    if (similarSnippets.length === 0) {
      similarSnippets.push({
        userId: 'no_match',
        similarity: 0,
        timestamp: new Date().toISOString(),
        code: '',
        fileName: 'no_match.js'
      });
    }

    return NextResponse.json({
      success: true,
      similarSnippets
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