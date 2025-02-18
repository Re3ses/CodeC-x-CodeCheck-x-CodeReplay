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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const problemId: string = searchParams.get('problem_id')!;
  const all: boolean = searchParams.get('all') === 'true';

  try {
    await dbConnect();

    const db = mongoose.connection;

    const problemCollection = db.collection('problems');

    // Get all
    if (all) {
      const problems = await problemCollection.find({}).toArray();

      return NextResponse.json({
        message: 'All problem fetched',
        problems: problems,
      });
    }

    // Get one
    if (problemId !== '') {
      const problem = await problemCollection.findOne({
        _id: new ObjectId(problemId),
      });

      return NextResponse.json({
        message: 'Success!',
        problem: problem,
      });
    }
  } catch {
    return new NextResponse(
      `Failed to get specified problem with id of: ${problemId}`,
      {
        status: 500,
      }
    );
  }
}
