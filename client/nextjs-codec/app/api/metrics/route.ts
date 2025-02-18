import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';
import { NextResponse } from 'next/server';
import dbConnect from '../../../lib/dbConnect';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const userId: string = searchParams.get('user_id') || '';

  try {
    await dbConnect();

    const db = mongoose.connection;
    const coderoomsCollection = db.collection('coderooms');
    const problemsCollection = db.collection('problems');
    const submissionsCollection = db.collection('usersubmissions');

    const coderooms = await coderoomsCollection
      .aggregate([
        {
          $match: {
            mentor: new ObjectId(userId),
          },
        },
      ])
      .toArray();

    const problems = await problemsCollection
      .aggregate([
        {
          $match: {
            mentor: new ObjectId(userId),
          },
        },
      ])
      .toArray();

    const joinedRooms = await coderoomsCollection
      .aggregate([
        {
          $match: {
            'enrollees.learner': new ObjectId(userId),
          },
        },
      ])
      .toArray();

    const solvedProblems = await submissionsCollection
      .aggregate([
        {
          $match: {
            learner_id: new ObjectId(userId),
          },
        },
      ])
      .toArray();

    return NextResponse.json({
      created_coderooms_count: coderooms.length,
      created_problems_count: problems.length,
      solved_problems_count: solvedProblems.length,
      joined_rooms_count: joinedRooms.length,
    });
  } catch (e) {
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
