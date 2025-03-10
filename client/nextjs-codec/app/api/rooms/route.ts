import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../lib/dbConnect';
import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';
import { nanoid } from 'nanoid'
import { CreateRoom } from '@/utilities/apiService';

export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const room_id: string | null = searchParams.get('room_id');

  if (!room_id) {
    return new NextResponse('Room ID is required', { status: 400 });
  }

  try {
    await dbConnect();

    const db = mongoose.connection;
    const rooms = db.collection('coderooms');

    if (!ObjectId.isValid(room_id)) {
      return new NextResponse('Invalid Room ID', { status: 400 });
    }

    const result = await rooms.deleteOne({ _id: new ObjectId(room_id) });
    if (result.deletedCount === 0) {
      return new NextResponse(`No room found with id: ${room_id}`, { status: 404 });
    }

    return new NextResponse(`Room with id of: ${room_id} was successfully deleted`, { status: 200 });
  } catch (error) {
    console.error('Failed to connect to the database:', error);
    return new NextResponse('Database connection failed', { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const room_id: string = searchParams.get('room_id')!;
  const slug: string = searchParams.get('slug')!;

  try {
    await dbConnect();

    const db = mongoose.connection;
    const roomsCollection = db.collection('coderooms');

    if (room_id !== null) {
      const room = await roomsCollection.findOne({
        _id: new ObjectId(room_id),
      });

      return NextResponse.json({
        message: 'Success! Get via room_id.',
        room: room,
        params: { room_id: room_id, slug: slug },
      }, { status: 200 });
    }

    if (slug !== null) {
      const room = await roomsCollection.findOne({ slug: slug });

      return NextResponse.json({
        message: 'Success! Get via slug.',
        room: room,
        params: { room_id: room_id, slug: slug },
      }, { status: 200 });
    }
  } catch (e) {
    return NextResponse.json({
      message: `Failed to fetch room data with room id of: ${room_id}`,
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();

    const data = await request.json();

    if (!data.name || !data.releaseDate || !data.dueDate) {
      return NextResponse.json({ error: 'Missing required fields: name, releaseDate, dueDate' }, { status: 400 });
    }

    const roomData = {
      ...data,
      releaseDate: new Date(data.releaseDate),
      dueDate: new Date(data.dueDate),
      slug: `${data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${nanoid(6)}`,
    };

    const res = await CreateRoom(roomData);

    return NextResponse.json({
      title: 'Room created successfully',
      description: 'You can see the invite code in the room itself',
      room: res,
    }, { status: 201 });

  } catch (error: any) {
    console.error('Room creation error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create room' }, { status: 500 });
  }
}

export async function HEALTHCHECK(request: Request) {
  try {
    await dbConnect();

    return NextResponse.json({
      status: 'OK',
      message: 'Server is running smoothly!',
    }, { status: 200 });

  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json({
      status: 'FAIL',
      message: 'Database connection failed',
    }, { status: 500 });
  }
}
