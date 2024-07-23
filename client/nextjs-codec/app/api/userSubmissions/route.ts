import { NextResponse } from 'next/server';
import dbConnect from '../../../lib/dbConnect';
import UserSubmissions from '@/models/UserSubmissions';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const learner = searchParams.get('learner');
  const learner_id = searchParams.get('learner_id');
  const problem = searchParams.get('problem');
  const room = searchParams.get('room');
  const verdict = searchParams.get('verdict');

  let perPage = parseInt(searchParams.get('perPage')!);
  let page = parseInt(searchParams.get('page')!);

  try {
    await dbConnect();

    const query: any = {};

    if (learner) {
      query['learner'] = { $regex: new RegExp(`^${learner}$`, 'i') };
    }
    if (learner) {
      query['learner_id'] = { $regex: new RegExp(`^${learner_id}$`, 'i') };
    }
    if (problem) {
      query['problem'] = { $regex: new RegExp(`^${problem}$`, 'i') };
    }
    if (room) {
      query['room'] = { $regex: new RegExp(`^${room}$`, 'i') };
    }
    if (verdict) {
      query['verdict'] = { $regex: new RegExp(`^${verdict}$`, 'i') };
    }

    const userSubmissionsCount = await UserSubmissions.countDocuments();

    if ((perPage * page) > userSubmissionsCount) {
      perPage = userSubmissionsCount % perPage;
    }

    const userSubmissions = await UserSubmissions.find(query)
      .skip(perPage * (page - 1))
      .limit(perPage);

    return NextResponse.json({
      message: 'Connected!',
      count: userSubmissionsCount,
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
      learner_id: formData.get('learner_id'),
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
