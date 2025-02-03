import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/dbConnect';
import mongoose from 'mongoose';
import { seedCodeSnapshots } from '../../../codereplay/SeedData';

// Define the schema for code snapshots
const CodeSnapshotSchema = new mongoose.Schema({
  code: String,
  timestamp: { type: Date, default: Date.now },
  userId: String,
  submissionId: String,
  roomId: String,
  problemId: String,
  version: { type: Number, required: true }
});

// Use CodeSnapshots instead of CodeSnippet
const CodeSnapshots = mongoose.models.CodeSnapshots || 
  mongoose.model('CodeSnapshots', CodeSnapshotSchema);

export async function GET() {
  try {
    await dbConnect();

    // Force clear existing data and reseed
    await CodeSnapshots.deleteMany({});

    // Insert seed data
    const seedDocuments = seedCodeSnapshots.flatMap(submission => 
      submission.snapshots.map((snapshot, index) => ({
        code: snapshot.code,
        timestamp: new Date(snapshot.timestamp),
        userId: submission.userId,
        roomId: submission.roomId,
        problemId: submission.problemId,
        submissionId: submission.submissionId,
        version: index + 1
      }))
    );

    const insertedSnapshots = await CodeSnapshots.insertMany(seedDocuments);
    return NextResponse.json({ 
      message: 'Seed data inserted successfully', 
      count: insertedSnapshots.length,
      details: insertedSnapshots
    });
  } catch (error) {
    console.error('Seed data insertion error:', error);
    return NextResponse.json({ 
      message: 'Failed to insert seed data',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Add a POST method to allow partial updates
export async function POST(request: Request) {
  try {
    await dbConnect();

    // Parse the request body
    const { action } = await request.json();

    if (action === 'update') {
      // Clear existing data and reseed
      await CodeSnapshots.deleteMany({});

      const seedDocuments = seedCodeSnapshots.flatMap(submission => 
        submission.snapshots.map((snapshot, index) => ({
          code: snapshot.code,
          timestamp: new Date(snapshot.timestamp),
          userId: submission.userId,
          roomId: submission.roomId,
          problemId: submission.problemId,
          submissionId: submission.submissionId,
          version: index + 1
        }))
      );

      const insertedSnapshots = await CodeSnapshots.insertMany(seedDocuments);
      return NextResponse.json({ 
        message: 'Seed data updated successfully', 
        count: insertedSnapshots.length,
        details: insertedSnapshots
      });
    }

    return NextResponse.json({ 
      message: 'No action specified',
    }, { status: 400 });
  } catch (error) {
    console.error('Seed data update error:', error);
    return NextResponse.json({ 
      message: 'Failed to update seed data',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}