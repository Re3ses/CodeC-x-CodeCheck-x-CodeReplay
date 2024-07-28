import { NextResponse } from 'next/server';
import dbConnect from '../../../lib/dbConnect';
import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);

  const room_id = searchParams.get('room_id') || ' ';

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
