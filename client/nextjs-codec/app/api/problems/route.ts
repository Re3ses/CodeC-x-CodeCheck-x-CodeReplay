import { NextResponse } from 'next/server';
import dbConnect from '../../../lib/dbConnect';
import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);

  const problemId: string = searchParams.get('problem_id')!;

  try {
    await dbConnect();

    const db = mongoose.connection;

    const problemsCollection = db.collection('problems');

    problemsCollection.deleteOne({ _id: new ObjectId(problemId) });

    return NextResponse.json(
      {
        message: `problem with id of: ${problemId} was successfully deleted`,
        problem_id: problemId,
      },
      { status: 200 }
    );
  } catch {
    return new NextResponse(
      `Failed to delete specified problem with id of: ${problemId}`,
      {
        status: 500,
      }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: { problem_id?: string } }
) {
  const { searchParams } = new URL(request.url);
  const all: boolean = searchParams.get('all') === 'true';

  try {
    await dbConnect();
    const db = mongoose.connection;
    const problemCollection = db.collection('problems');

    // Get all problems if 'all' parameter is true
    if (all) {
      const problems = await problemCollection.find({}).toArray();
      return NextResponse.json({
        message: 'All problems fetched successfully',
        problems: problems,
      });
    }

    // Get a specific problem by ID or slug
    // First try to get the problem_id from route params, then from query params
    const problemId = params.problem_id || searchParams.get('problem_id');

    if (!problemId) {
      return NextResponse.json(
        { message: 'Problem ID or slug is required when not fetching all problems' },
        { status: 400 }
      );
    }

    // Create the query based on whether the provided ID is a valid ObjectId
    let query: any = { slug: problemId }; // Default to searching by slug

    // If the ID matches ObjectId pattern, add ObjectId search condition
    if (problemId.match(/^[0-9a-fA-F]{24}$/)) {
      query = {
        $or: [
          { _id: new ObjectId(problemId) },
          { slug: problemId }
        ]
      };
    }

    const problem = await problemCollection.findOne(query);

    if (!problem) {
      return NextResponse.json(
        { message: `Problem not found with id/slug: ${problemId}` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Success!',
      problem: problem
    });

  } catch (error) {
    console.error('Error fetching problem(s):', error);
    return NextResponse.json(
      { message: `Failed to get problem(s): ${error}` },
      { status: 500 }
    );
  }
}