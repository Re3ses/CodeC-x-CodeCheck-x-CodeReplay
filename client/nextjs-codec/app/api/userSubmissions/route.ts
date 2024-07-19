import { NextResponse } from 'next/server';
import dbConnect from '../../../lib/dbConnect';
import UserSubmissions from '@/models/UserSubmissions';

export async function GET() {
  try {
    await dbConnect();

    const userSubmissions = await UserSubmissions.find();

    return NextResponse.json({
      message: 'Connected!',
      submissions: userSubmissions,
    });
  } catch (e) {
    return NextResponse.json(e, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();

    const formData = await request.formData();

    const userSubmission = new UserSubmissions({
      language_used: formData.get('language_used'),
      code: formData.get('code'),
      score: formData.get('score'),
      score_overall_count: formData.get('score_overall_count'),
      verdict: formData.get('verdict'),
      learner: formData.get('learner'),
      problem: formData.get('problem'),
      room: formData.get('room'),
      attempt_count: formData.get('attempt_count'),
      start_time: formData.get('start_time'),
      end_time: formData.get('end_time'),
      completion_time: formData.get('completion_time'), // in ms
    });

    await userSubmission.save();

    return NextResponse.json({
      message: 'User submission entry created!',
      submission: userSubmission,
    });
  } catch (e) {
    return NextResponse.json(e, { status: 500 });
  }
}
