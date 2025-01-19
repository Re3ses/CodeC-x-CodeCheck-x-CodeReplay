// app/api/codereplay/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '../../../lib/dbConnect';
import mongoose from 'mongoose';

const CodeSnippetSchema = new mongoose.Schema({
  code: String,
  timestamp: { type: Date, default: Date.now },
  userId: String,
  submissionId: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  roomId: String,
  roomName: String,
  problemId: String,
  problemName: String
});

const CodeSnippet = mongoose.models.CodeSnippet || mongoose.model('CodeSnippet', CodeSnippetSchema);

export async function POST(request: Request) {
  try {
    await dbConnect();
    const { code, problemId, roomId } = await request.json();

    const snippet = await CodeSnippet.create({
      code,
      problemId,
      roomId,
      userId: 'test-user-1', // Using test user for now
      submissionId: new mongoose.Types.ObjectId().toString()
    });

    return NextResponse.json({ success: true, snippet });
  } catch (error) {
    console.error('Error saving code:', error);
    return NextResponse.json({ success: false, error: 'Failed to save code' });
  }
}

export async function GET() {
  try {
    await dbConnect();
    const snippets = await CodeSnippet.find({ userId: 'test-user-1' })
      .sort({ timestamp: -1 })
      .limit(10);

    return NextResponse.json({ success: true, snippets });
  } catch (error) {
    console.error('Error fetching snippets:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch snippets' });
  }
}


