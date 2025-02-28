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
  { params }: { params: { problem_id: string } }
) {
  try {
    await dbConnect();

    const db = mongoose.connection;
    const problemCollection = db.collection('problems');
    
    const problem = await problemCollection.findOne({
      // Try to find by ObjectId first
      $or: [
        { _id: params.problem_id.match(/^[0-9a-fA-F]{24}$/) ? new ObjectId(params.problem_id) : null },
        { slug: params.problem_id } // Also try to find by slug
      ]
    });

    if (!problem) {
      return NextResponse.json(
        { message: `Problem not found with id/slug: ${params.problem_id}` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Success!',
      ...problem
    });

  } catch (error) {
    console.error('Error fetching problem:', error);
    return NextResponse.json(
      { message: `Failed to get problem: ${error.message}` },
      { status: 500 }
    );
  }
}
