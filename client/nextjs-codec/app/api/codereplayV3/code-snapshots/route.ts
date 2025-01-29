// code snapshot route for codereplay v3
import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/dbConnect';
import mongoose from 'mongoose';

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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  try {
    await dbConnect();

    // Fetch all snapshots, sorted by userId, problemId, and version
    let snapshots = await CodeSnapshots.find({})
      .sort({
        userId: 1,
        problemId: 1,
        version: 1
      })
      .lean();

    if (searchParams.has('learner_id')) {
      snapshots = await
        CodeSnapshots.find({
          userId: searchParams.get('learner_id')
        }).sort({
          userId: 1,
          problemId: 1,
          version: 1
        })
          .lean();
    } else {
      
    }

    return NextResponse.json({
      success: true,
      snapshots: snapshots.map(snapshot => ({
        code: snapshot.code,
        timestamp: snapshot.timestamp.toISOString(),
        userId: snapshot.userId,
        problemId: snapshot.problemId,
        roomId: snapshot.roomId,
        submissionId: snapshot.submissionId,
        version: snapshot.version
      })),
      metadata: {
        totalSnapshots: snapshots.length,
        uniqueUsers: [...new Set(snapshots.map(s => s.userId))].length,
        uniqueProblems: [...new Set(snapshots.map(s => s.problemId))].length
      }
    });
  } catch (error) {
    console.error('Error fetching snapshots:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch snapshots',
      snapshots: [],
      metadata: {}
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();

    // Parse the entire request body
    const { code, userId, problemId, roomId, submissionId, version } = await request.json();

    // Validate required fields
    if (!code || !userId || !problemId || !roomId) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields'
      }, { status: 400 });
    }

    // Find the latest version for this user, problem, and room
    const latestSnapshot = await CodeSnapshots.findOne({
      userId,
      problemId,
      roomId
    }).sort({ version: -1 });

    // Increment version if not provided
    const newVersion = version || (latestSnapshot ? latestSnapshot.version + 1 : 1);

    // Create new snapshot
    const newSnapshot = new CodeSnapshots({
      code,
      userId,
      problemId,
      roomId,
      submissionId: submissionId || `submission-${Date.now()}`,
      version: newVersion,
      timestamp: new Date()
    });

    // Save the snapshot
    await newSnapshot.save();

    return NextResponse.json({
      success: true,
      snippet: {
        code: newSnapshot.code,
        timestamp: newSnapshot.timestamp.toISOString(),
        userId: newSnapshot.userId,
        problemId: newSnapshot.problemId,
        roomId: newSnapshot.roomId,
        submissionId: newSnapshot.submissionId,
        version: newSnapshot.version
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error saving snapshot:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save snapshot'
    }, { status: 500 });
  }
}

