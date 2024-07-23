import mongoose, { ConnectOptions } from 'mongoose';
import { ObjectId } from 'mongodb';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  await mongoose.connect(process.env.MONGODB_URI!, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  } as ConnectOptions);

  const db = mongoose.connection;
  const coderoomsCollection = db.collection('coderooms');
  const problemsCollection = db.collection('problems');

  try {
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
    console.error('Error in [Metrics] connecting to mongodb client: ', e);
  }
}
