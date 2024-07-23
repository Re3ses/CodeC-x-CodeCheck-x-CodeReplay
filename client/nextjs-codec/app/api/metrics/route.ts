import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';
import { NextResponse } from 'next/server';
import dbConnect from '../../../lib/dbConnect';

export async function GET(request: Request) {
  try {
    await dbConnect();

    const db = mongoose.connection;
    const coderoomsCollection = db.collection('coderooms');
    const problemsCollection = db.collection('problems');

    const coderoomsCount = await coderoomsCollection
      .aggregate([
        {
          $match: {
            mentor: new ObjectId('667de486692ab698db4d2e75'),
          },
        },
      ])
      .toArray();

    const problemsCount = await problemsCollection
      .aggregate([
        {
          $match: {
            mentor: new ObjectId('667de486692ab698db4d2e75'),
          },
        },
      ])
      .toArray();

    return NextResponse.json({
      created_coderooms_count: coderoomsCount.length,
      created_problems_count: problemsCount.length,
    });
  } catch (e) {
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
