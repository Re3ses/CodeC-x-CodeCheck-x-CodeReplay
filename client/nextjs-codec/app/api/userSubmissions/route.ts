import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../lib/dbConnect';
import UserSubmission from '@/models/UserSubmissions';
import mongoose from 'mongoose';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const room_id = searchParams.get('room_id');
  const problem_slug = searchParams.get('problem_slug');
  const all: boolean = Boolean(searchParams.get('all')?.toLowerCase() === 'true');
  const single: boolean = Boolean(searchParams.get('single')?.toLowerCase() === 'true');

  try {
    await dbConnect();

    const db = mongoose.connection;

    const userSubmissionCollection = db.collection('usersubmissions');

    // All via room_id - ..?room_id=example_room_id_123
    if (room_id !== null && !single) {
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

    // All via room_id but only the first accepted submissions only per learner - ...?room_id=example_room_id_123?all=true&single=true
    if (room_id !== null && all === true && single === true) {
      const submissions = await userSubmissionCollection.aggregate([
        {
          $match: {
            room: room_id,
            verdict: "ACCEPTED"
          }
        },
        {
          $sort: {
            submission_date: -1 // Sort by latest submission first
          }
        },
        {
          $group: {
            _id: "$learner",
            submission: { $first: "$$ROOT" } // Take the first (latest) submission for each learner
          }
        },
        {
          $replaceRoot: { newRoot: "$submission" } // Replace the root to get the original document structure
        }
      ]).toArray();

      return NextResponse.json({
        message: 'Success! one accepted submission per learner',
        problem_slug: problem_slug,
        submission: submissions,
      });
    }

    // All via problem_slug - ...?problem_slug=example_slug_123?all=True
    if (problem_slug !== null && all === true && !single) {
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

    // All via problem_slug but only the first accepted submissions only per learner - ...?problem_slug=example_slug_123?all=true&single=true
    if (problem_slug !== null && all === true && single === true) {
      const submissions = await userSubmissionCollection.aggregate([
        {
          $match: {
            problem: problem_slug,
            verdict: "ACCEPTED"
          }
        },
        {
          $sort: {
            submission_date: -1 // Sort by latest submission first
          }
        },
        {
          $group: {
            _id: "$learner",
            submission: { $first: "$$ROOT" } // Take the first (latest) submission for each learner
          }
        },
        {
          $replaceRoot: { newRoot: "$submission" } // Replace the root to get the original document structure
        }
      ]).toArray();

      return NextResponse.json({
        message: 'Success! one accepted submission per learner',
        problem_slug: problem_slug,
        submission: submissions,
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

    // All but only the first accepted submissions only per learner - ...?problem_slug=example_slug_123?all=true&single=true
    if (all === true && single === true) {
      const submissions = await userSubmissionCollection.aggregate([
        {
          $match: {
            verdict: "ACCEPTED"
          }
        },
        {
          $sort: {
            submission_date: -1 // Sort by latest submission first
          }
        },
        {
          $group: {
            _id: "$learner",
            submission: { $first: "$$ROOT" } // Take the first (latest) submission for each learner
          }
        },
        {
          $replaceRoot: { newRoot: "$submission" } // Replace the root to get the original document structure
        }
      ]).toArray();

      return NextResponse.json({
        message: 'Success! one accepted submission per learner',
        problem_slug: problem_slug,
        submission: submissions,
      });
    }

    // All - ...?all=true
    if (all === true) {
      const allSubmissions = await userSubmissionCollection.find({}).toArray();

      return NextResponse.json({
        message: 'Fetch all Success!',
        slug: problem_slug,
        all: all,
        submissions: allSubmissions,
      });
    }

    // If no query parameter is provided
    if (all === false) {
      return NextResponse.json({
        message: 'Please provide a query parameter',
        query_params: {
          problem_slug,
          all,
          single
        }
      }, { status: 400 });
    }

  } catch (e) {
    return NextResponse.json({
      error: e,
      message: "An error occurred",
      query_params: {
        problem_slug,
        all,
        single
      }
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    console.log('Connecting to database...');
    await dbConnect();
    console.log('Database connected successfully');

    console.log('Parsing form data...');
    const formData = await request.formData();
    console.log('Form data received:', formData);

    const userSubmissionData = {
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
      completion_time: formData.get('completion_time'),
      similarity_score: formData.get('similarity_score'),
      most_similar: formData.get('most_similar'),
      paste_history: formData.get('paste_history'), // Save the parsed array
    };

    console.log('Creating new UserSubmission with data:', userSubmissionData);
    const userSubmission = new UserSubmission(userSubmissionData);

    console.log('Saving UserSubmission...');
    await userSubmission.save();
    console.log('User submission saved successfully');

    return NextResponse.json({
      message: 'User submission entry created!',
      submission: userSubmission,
    });
  } catch (e) {
    console.error("Error in POST route:", e); // Log the error for debugging
    return NextResponse.json({
      error: e instanceof Error ? e.message : 'Unknown error',
      stack: e instanceof Error ? e.stack : 'No stack available'
    }, { status: 500 });
  }
}