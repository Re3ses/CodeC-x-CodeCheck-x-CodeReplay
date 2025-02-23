import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import UserSubmissions from '@/models/UserSubmissions';

export async function GET(request: Request) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const room_id = searchParams.get('room_id');

    if (!room_id) {
      return NextResponse.json({ error: 'Room ID is required' }, { status: 400 });
    }

    // Get count of problems with perfect scores (where score equals score_overall_count)
    const perfectScoreCount = await UserSubmissions.aggregate([
      {
        $match: {
          room: room_id,
          $expr: { $eq: ["$score", "$score_overall_count"] }
        }
      },
      {
        $group: {
          _id: "$problem",
          perfectScore: { $max: { $eq: ["$score", "$score_overall_count"] } }
        }
      },
      {
        $match: {
          perfectScore: true
        }
      },
      {
        $count: "count"
      }
    ]).then(result => result[0]?.count || 0);

    return NextResponse.json({ perfectScoreCount });

  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch submission stats' },
      { status: 500 }
    );
  }
}