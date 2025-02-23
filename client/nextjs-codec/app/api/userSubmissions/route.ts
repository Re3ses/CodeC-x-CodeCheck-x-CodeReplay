import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../lib/dbConnect';
import UserSubmissions from '@/models/UserSubmissions';
import mongoose from 'mongoose';

export async function GET(request: Request) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    // Change room_id to room to match interface
    const room = searchParams.get('room_id'); // Keep param name for backwards compatibility
    const problem = searchParams.get('problem');
    const learner_id = searchParams.get('learner_id');

    // console.log('Search params received:', { room, problem, learner_id });

    const query: Record<string, any> = {};
    
    if (room) {
      query.room = room; // Match the interface field name
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

    // Get submissions with populated problem data for perfect score
    const submissions = await UserSubmissions
      .find(query)
      .sort({ submission_date: -1 })
      .lean()
      .exec();

    // Log found submissions
    // console.log('Submissions found:', submissions.length);
    submissions.forEach((sub, i) => {
      // console.log(`Submission ${i + 1}:`, {
      //   problem: sub.problem,
      //   score: sub.score,
      //   overall: sub.score_overall_count
      // });
    }
  );

    return NextResponse.json({ 
      success: true,
      submissions: submissions.map(sub => ({
        ...sub,
        score: sub.score || 0, // Ensure score is not null
        score_overall_count: sub.score_overall_count || 0
      })),
      count: submissions.length
    });

  } catch (error: any) {
    console.error('Fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const formData = await request.formData();

    // Parse and validate test results and problem data
    const testResults = JSON.parse(formData.get('testResults') || '[]');
    const problemData = JSON.parse(formData.get('problemData') || '{}');
    
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
      verdict: testResults.every(r => r.status.description === "Accepted") ? 'ACCEPTED' : 'REJECTED',
      learner: formData.get('learner'),
      learner_id: formData.get('learner_id'),
      problem: formData.get('problem'),
      room: formData.get('room'),
      start_time: Number(formData.get('start_time')) || Date.now(),
      end_time: Number(formData.get('end_time')) || Date.now(),
      completion_time: Number(formData.get('completion_time')) || 0,
      attempt_count: existingSubmission ? (existingSubmission.attempt_count + 1) : 1
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