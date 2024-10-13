import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../lib/dbConnect';
import UserSubmissions from '@/models/UserSubmissions';
import mongoose from 'mongoose';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const room_id = searchParams.get('room_id');
  const problem_slug = searchParams.get('problem_slug');
  const all = searchParams.get('all') === 'true';

  try {
    await dbConnect();

    const db = mongoose.connection;

    const userSubmissionCollection = db.collection('usersubmissions');

    // All via room_id - ..?room_id=example_room_id_123
    if (room_id !== null) {
      const submission = await userSubmissionCollection
        .find({
          room: room_id,
        })
        .toArray();

      return NextResponse.json({
        message: 'Success! all via room_id',
        room_slug: room_id,
        submission: submission,
      });
    }

    // All via problem_slug - ...?problem_slug=example_slug_123?all=True
    if (problem_slug !== null && all) {
      const submission = await userSubmissionCollection
        .find({
          problem: problem_slug,
        })
        .toArray();

      return NextResponse.json({
        message: 'Success! all via problem_slug',
        problem_slug: problem_slug,
        submission: submission,
      });
    }

    // Individual via problem_slug - ...?problem_slug=example_slug_123
    if (problem_slug !== null && !all) {
      const submission = await userSubmissionCollection.findOne({
        problem: problem_slug,
      });

      return NextResponse.json({
        message: 'Success! individual via problem_slug',
        problem_slug: problem_slug,
        submission: submission,
      });
    }

    // All - ...?all=true
    if (all) {
      const allSubmissions = await userSubmissionCollection.find({}).toArray();

      return NextResponse.json({
        message: 'Fetch all Success!',
        slug: problem_slug,
        submissions: allSubmissions,
      });
    }
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
      similarity_score: formData.get('similarity_score'),
      most_similar: formData.get('most_similar'),
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

export async function PATCH(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  const room_id = searchParams.get('room_id');
  const problem_slug = searchParams.get('problem_slug');
  const learner_id = searchParams.get('learner_id');

  if (!room_id || !problem_slug || !learner_id) {
    return NextResponse.json({ message: 'room_id, problem_slug, and learner_id are required' }, { status: 400 });
  }

  try {
    await dbConnect();

    const formData = await request.formData();
    const updateData: any = {};

    formData.forEach((value, key) => {
      updateData[key] = value;
    });

    const updatedSubmission = await UserSubmissions.findOneAndUpdate(
      { room: room_id, problem: problem_slug, learner_id: learner_id },
      updateData,
      { new: true }
    );

    if (!updatedSubmission) {
      return NextResponse.json({ message: 'Submission not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'User submission entry updated!',
      submission: updatedSubmission,
    });
  } catch (e) {
    return NextResponse.json(e, { status: 500 });
  }
}
