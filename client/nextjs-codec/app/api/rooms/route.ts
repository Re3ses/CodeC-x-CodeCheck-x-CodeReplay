import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../lib/dbConnect';
import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';

export async function DELETE(request: NextRequest) {
  console.log('DELETE request received');

  const searchParams = request.nextUrl.searchParams;
  const room_id: string | null = searchParams.get('room_id');

  console.log('room_id:', room_id);

  if (!room_id) {
    return new NextResponse('Room ID is required', { status: 400 });
  }

  try {
    await dbConnect();
    console.log('Database connected successfully');
    
    const db = mongoose.connection;
    const rooms = db.collection('coderooms');

    // Ensure room_id is a valid ObjectId
    if (!ObjectId.isValid(room_id)) {
      return new NextResponse('Invalid Room ID', { status: 400 });
    }

    console.log("room_id is a valid ObjectId");
    console.log("Trying to delete room with id of:", room_id);

    const result = await rooms.deleteOne({ _id: new ObjectId(room_id) });
    console.log("result:", result);
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

export async function POST(request: Request) {
  try {
    await dbConnect();

    const data = await request.json();
    
    // Parse the date strings into Date objects
    const roomData = {
      ...data,
      releaseDate: new Date(data.releaseDate),
      dueDate: new Date(data.dueDate),
      slug: `${data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${nanoid(6)}`,
    };

    console.log('Creating room with data:', roomData); // Debug log

    const room = await Room.create(roomData);

    return NextResponse.json({
      message: 'Room created successfully',
      room
    });

  } catch (error: any) {
    console.error('Room creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create room' },
      { status: 500 }
    );
  }
}
