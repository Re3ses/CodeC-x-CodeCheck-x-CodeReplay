// api/userSubmissions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../lib/dbConnect';
import UserSubmissions from '@/models/UserSubmissions';
import mongoose from 'mongoose';

export async function GET(request: Request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);

    // Support both naming conventions for backward compatibility
    const room = searchParams.get('room_id') || searchParams.get('room');
    const problem = searchParams.get('problem_slug') || searchParams.get('problem');
    const learner_id = searchParams.get('learner_id');
    const all = searchParams.get('all')?.toLowerCase() === 'true';
    const single = searchParams.get('single')?.toLowerCase() === 'true';
    const highest = searchParams.get('highest')?.toLowerCase() === 'true';
    const highestPerProblem = searchParams.get('highestPerProblem')?.toLowerCase() === 'true';
    const verdict = searchParams.get('verdict');

    // Build query object dynamically
    const query: Record<string, any> = {};

    // Add accepted verdict to filter
    query.verdict = verdict || 'ACCEPTED';

    if (room) {
      query.room = room;
    }

    if (problem) {
      query.problem = problem;
    }

    if (learner_id) {
      try {
        query.learner_id = new mongoose.Types.ObjectId(learner_id);
      } catch (error) {
        console.warn('Invalid learner_id format:', learner_id);
      }
    }

    // If no query parameters provided and not requesting all
    if (Object.keys(query).length === 0 && !all) {
      return NextResponse.json({
        success: false,
        message: 'Please provide at least one query parameter',
        query_params: { room, problem, learner_id, all, single, highest, highestPerProblem }
      }, { status: 400 });
    }

    // Handle highestPerProblem parameter (new functionality)
    if (highestPerProblem === true) {
      try {
        // First get all matching submissions
        const allSubmissions = await UserSubmissions
          .find(query)
          .lean()
          .exec();

        // Then manually process them to get highest score per problem per learner
        const submissionMap = new Map();

        // Group and find highest score for each learner-problem pair
        allSubmissions.forEach(submission => {
          const key = `${submission.learner_id}-${submission.problem}`;

          if (!submissionMap.has(key) || (submissionMap.get(key).score < submission.score)) {
            submissionMap.set(key, submission);
          }
        });

        // Convert map back to array
        const highestSubmissions = Array.from(submissionMap.values());

        return NextResponse.json({
          success: true,
          message: 'Success! One highest scoring accepted submission per learner per problem',
          submissions: highestSubmissions.map(sub => ({
            ...sub,
            score: sub.score || 0,
            score_overall_count: sub.score_overall_count || 0
          })),
          count: highestSubmissions.length
        });
      } catch (error: any) {
        console.error('Error in highestPerProblem processing:', error);
        return NextResponse.json({
          success: false,
          error: error.message
        }, { status: 500 });
      }
    }

    // Handle one submission per learner case (original functionality)
    if (single === true) {
      if (highest === true) {
        try {
          // First get all matching submissions
          const allSubmissions = await UserSubmissions
            .find(query)
            .lean()
            .exec();

          // Then manually process them to get highest score per learner
          const submissionMap = new Map();

          // Group and find highest score for each learner
          allSubmissions.forEach(submission => {
            const key = `${submission.learner_id}`;

            if (!submissionMap.has(key) || (submissionMap.get(key).score < submission.score)) {
              submissionMap.set(key, submission);
            }
          });

          // Convert map back to array
          const highestSubmissions = Array.from(submissionMap.values());

          return NextResponse.json({
            success: true,
            message: 'Success! One accepted submission per learner sorted by highest score',
            submissions: highestSubmissions.map(sub => ({
              ...sub,
              score: sub.score || 0,
              score_overall_count: sub.score_overall_count || 0
            })),
            count: highestSubmissions.length
          });
        } catch (error: any) {
          console.error('Error in single highest processing:', error);
          return NextResponse.json({
            success: false,
            error: error.message
          }, { status: 500 });
        }
      } else {
        try {
          // Get all matching submissions
          const allSubmissions = await UserSubmissions
            .find(query)
            .sort({ submission_date: -1 })
            .lean()
            .exec();

          // Then manually process them to get latest submission per learner
          const submissionMap = new Map();

          // Group and find latest submission for each learner
          allSubmissions.forEach(submission => {
            const key = `${submission.learner_id}`;

            // For each learner, we only want to keep first one we encounter
            // since we've already sorted by submission_date descending
            if (!submissionMap.has(key)) {
              submissionMap.set(key, submission);
            }
          });

          // Convert map back to array
          const latestSubmissions = Array.from(submissionMap.values());

          return NextResponse.json({
            success: true,
            message: 'Success! One accepted submission per learner sorted by submission date',
            submissions: latestSubmissions.map(sub => ({
              ...sub,
              score: sub.score || 0,
              score_overall_count: sub.score_overall_count || 0
            })),
            count: latestSubmissions.length
          });
        } catch (error: any) {
          console.error('Error in single processing:', error);
          return NextResponse.json({
            success: false,
            error: error.message
          }, { status: 500 });
        }
      }
    }

    // Regular submissions query (from new code)
    const submissions = await UserSubmissions
      .find(query)
      .sort({ submission_date: -1 })
      .lean()
      .exec();

    return NextResponse.json({
      success: true,
      submissions: submissions.map(sub => ({
        ...sub,
        score: sub.score || 0,
        score_overall_count: sub.score_overall_count || 0
      })),
      count: submissions.length
    });

  } catch (error: any) {
    console.error('Fetch error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const formData = await request.formData();

    // Parse and validate test results and problem data
    const testResults = JSON.parse(formData.get('testResults') as string || '[]');
    const problemData = JSON.parse(formData.get('problemData') as string || '{}');

    if (!testResults.length || !problemData.test_cases) {
      throw new Error('Missing test results or problem data');
    }

    console.log('Processing submission:', {
      testCases: problemData.test_cases.length,
      testResults: testResults.length,
      perfectScore: problemData.perfect_score
    });

    let totalScore = 0;
    let overallScore = 0;

    // Calculate scores from test case results
    testResults.forEach((result: any, index: number) => {
      const testCase = problemData.test_cases[index];
      if (!testCase) {
        console.warn(`No test case found for index ${index}`);
        return;
      }

      if (result.status.description === "Accepted") {
        const testCaseScore = Number(testCase.score) || 0;
        totalScore += testCaseScore;
        console.log(`Test case ${index + 1} passed: +${testCaseScore} points`);
      }
    });

    // Get highest previous score
    const existingSubmission = await UserSubmissions.findOne({
      learner_id: formData.get('learner_id'),
      problem: formData.get('problem')
    }).sort({ score_overall_count: -1 });

    // Update overall score if new score is higher
    overallScore = Math.max(totalScore, existingSubmission?.score_overall_count || 0);

    // Create submission with validated data
    const submissionData = {
      language_used: formData.get('language_used'),
      code: formData.get('code'),
      score: totalScore,
      score_overall_count: overallScore,
      verdict: testResults.every((r: { status: { description: string } }) => r.status.description === "Accepted") ? 'ACCEPTED' : 'REJECTED',
      user_type: formData.get('user_type'),
      learner: formData.get('learner'),
      learner_id: formData.get('learner_id'),
      problem: formData.get('problem'),
      room: formData.get('room'),
      start_time: Number(formData.get('start_time')) || Date.now(),
      end_time: Number(formData.get('end_time')) || Date.now(),
      completion_time: Number(formData.get('completion_time')) || 0,
      attempt_count: existingSubmission ? (existingSubmission.attempt_count + 1) : 1,
      paste_history: formData.get('paste_history'),
    };

    const userSubmission = new UserSubmissions(submissionData);

    await userSubmission.save();

    console.log('Submission saved:', {
      totalScore,
      overallScore,
      perfectScore: problemData.perfect_score,
      verdict: submissionData.verdict
    });

    return NextResponse.json({
      message: 'Submission created successfully',
      submission: userSubmission,
      scores: {
        current: totalScore,
        overall: overallScore,
        perfect: problemData.perfect_score
      }
    });

  } catch (error: any) {
    console.error('Submission error:', {
      message: error.message,
      stack: error.stack
    });
    return NextResponse.json({
      error: 'Failed to create submission',
      details: error.message
    }, {
      status: 500
    });
  }
}