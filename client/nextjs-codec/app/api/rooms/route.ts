import { NextResponse } from 'next/server';
import dbConnect from '../../../lib/dbConnect';
import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);

  const room_id: string = searchParams.get('room_id')!;

  try {
    await dbConnect();

    const db = mongoose.connection;

    const rooms = db.collection('coderooms');

    rooms.deleteOne({ _id: new ObjectId(room_id) });
    return new NextResponse(
      `Room with id of: ${room_id} was successfully deleted`,
      {
        status: 200,
      }
    );
  } catch (e) {
    return NextResponse.json(
      {
        message: `Failed to do deletion operation on room with id of: ${room_id}`,
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const room_id: string = searchParams.get('room_id')!;

  try {
    await dbConnect();

    const db = mongoose.connection;

    const roomsCollection = db.collection('coderooms');

    if (room_id !== '') {
      const room = await roomsCollection.findOne({
        _id: new ObjectId(room_id),
      });

      return NextResponse.json(
        {
          message: 'Success!',
          room: room,
        },
        { status: 200 }
      );
    }
  } catch (e) {
    return NextResponse.json(
      {
        message: `Failed to fetch room data with room id of: ${room_id}`,
      },
      { status: 500 }
    );
  }
}
