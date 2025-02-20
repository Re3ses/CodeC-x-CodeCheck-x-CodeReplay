// code snapshot route for codereplay v3
import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/dbConnect';
import mongoose from 'mongoose';

// Define the schema for code snapshots
const CodeSnapshotSchema = new mongoose.Schema({
  code: String,
  timestamp: { type: Date, default: Date.now },
  learner_id: { type: mongoose.Types.ObjectId, ref: 'User', default: () => new mongoose.Types.ObjectId(), required: true },
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
  const learnerId = searchParams.get('learner_id');

  try {
    await dbConnect();

    // Build the query based on search parameters
    const query: { [key: string]: any } = {};
    if (learnerId) {
      query['learner_id'] = learnerId;
    }

    // Use a single query with conditional filtering
    const snapshots = await CodeSnapshots.find(query)
      .sort({
        learner_id: 1,
        problemId: 1,
        version: 1
      })
      .lean()
      .exec(); // Adding .exec() for better error handling

    // Early return if no snapshots found
    if (!snapshots.length) {
      return NextResponse.json({
        success: true,
        snapshots: [],
        metadata: {
          totalSnapshots: 0,
          uniqueUsers: 0,
        },
      });
    }

    // Return the snapshots
    return NextResponse.json({
      success: true,
      snapshots,
      metadata: {
        totalSnapshots: snapshots.length,
        uniqueUsers: new Set(snapshots.map(s => s.learner_id)).size,
      },
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}


export async function POST(request: Request) {
  try {
    await dbConnect();

    // Parse the entire request body
    const { code, learner_id, problemId, roomId, submissionId, version } = await request.json();

    // Validate required fields
    const missingFields = [];
    if (!code) missingFields.push('code');
    if (!learner_id) missingFields.push('learner_id');
    if (!problemId) missingFields.push('problemId');
    if (!roomId) missingFields.push('roomId');

    if (missingFields.length > 0) {
      return NextResponse.json({
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`
      }, { status: 400 });
    }

    // Find the latest version for this user, problem, and room
    const latestSnapshot = await CodeSnapshots.findOne({
      learner_id,
      problemId,
      roomId
    }).sort({ version: -1 });

    // Increment version if not provided
    const newVersion = version || (latestSnapshot ? latestSnapshot.version + 1 : 1);

    // Create new snapshot
    const newSnapshot = new CodeSnapshots({
      code,
      learner_id,
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
        learner_id: newSnapshot.learner_id,
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

