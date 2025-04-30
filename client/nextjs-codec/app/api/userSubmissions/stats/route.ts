// api/userSubmissions/stats/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import UserSubmissions from '@/models/UserSubmissions';
import mongoose from 'mongoose';

export async function GET(request: Request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const room_id = searchParams.get('room_id');
    const learner_id = searchParams.get('learner_id');

    if (!room_id) {
      return NextResponse.json({ error: 'Room ID is required' }, { status: 400 });
    }

    const query: Record<string, any> = {
      room: room_id,
      verdict: 'ACCEPTED' // Only count accepted submissions
    };

    // Add learner_id to the query if provided
    if (learner_id) {
      try {
        query.learner_id = new mongoose.Types.ObjectId(learner_id);
      } catch (error) {
        console.warn('Invalid learner_id format:', learner_id);
        return NextResponse.json({ error: 'Invalid learner ID format' }, { status: 400 });
      }
    }

    // Get distinct problems with highest score for this learner
    const uniqueSolvedProblems = await UserSubmissions.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$problem", // Group by problem
          highestScore: { $max: "$score" }, // Get the highest score for each problem
          submissionDetails: {
            $first: { // Keep the most relevant submission details
              submission_id: "$_id",
              score: "$score",
              score_overall_count: "$score_overall_count"
            }
          }
        }
      },
      // We can filter here by score threshold if needed
      // { $match: { highestScore: { $gte: someThreshold } } }
    ]).exec();

    // Get the total count
    const solvedProblems = uniqueSolvedProblems.length;

    // Optional: include the details of submissions for more context
    return NextResponse.json({
      solvedProblems,
      details: uniqueSolvedProblems,
      success: true
    });

  } catch (error: any) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch submission stats', details: error.message },
      { status: 500 }
    );
  }
}