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
  attemptCount: Number,
  version: { type: Number, required: true }
});

// Use CodeSnapshots instead of CodeSnippet
const CodeSnapshots = mongoose.models.CodeSnapshots ||
  mongoose.model('CodeSnapshots', CodeSnapshotSchema);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const learnerId = searchParams.get('learner_id');
  const attemptCount = searchParams.get('attempt_count');

  try {
    await dbConnect();

    // Build the query based on search parameters
    const query: { [key: string]: any } = {};
    if (learnerId) query['userId'] = learnerId;
    if (attemptCount) query['attemptCount'] = Number(attemptCount);

    // Use a single query with conditional filtering
    const snapshots = await CodeSnapshots.find(query)
      .sort({
        userId: 1,
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
          uniqueProblems: 0
        }
      });
    }

    // Process snapshots data
    const processedSnapshots = snapshots.map(snapshot => ({
      code: snapshot.code,
      timestamp: snapshot.timestamp.toISOString(),
      userId: snapshot.userId,
      problemId: snapshot.problemId,
      roomId: snapshot.roomId,
      submissionId: snapshot.submissionId,
      attemptCount: snapshot.attemptCount,
      version: snapshot.version
    }));

    // Calculate metadata using Set for better performance
    const uniqueUsers = new Set(snapshots.map(s => s.userId));
    const uniqueProblems = new Set(snapshots.map(s => s.problemId));

    return NextResponse.json({
      success: true,
      snapshots: processedSnapshots,
      metadata: {
        totalSnapshots: snapshots.length,
        uniqueUsers: uniqueUsers.size,
        uniqueProblems: uniqueProblems.size
      }
    });
  } catch (error) {
    console.error('Error fetching snapshots:', error);

    // Determine appropriate status code
    const statusCode = error.name === 'ValidationError' ? 400 : 500;

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch snapshots',
      snapshots: [],
      metadata: {}
    }, { status: statusCode });
  }
}


export async function POST(request: Request) {
  try {
    await dbConnect();

    // Parse the entire request body
    const { code, userId, problemId, roomId, submissionId, attemptCount, version } = await request.json();

    // Validate required fields
    const missingFields = [];
    if (!code) missingFields.push('code');
    if (!userId) missingFields.push('userId');
    if (!problemId) missingFields.push('problemId');
    if (!roomId) missingFields.push('roomId');
    if (attemptCount === undefined || attemptCount === null) missingFields.push('attemptCount');

    if (missingFields.length > 0) {
      return NextResponse.json({
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`
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
      attemptCount,
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
        attemptCount: newSnapshot.attemptCount,
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

