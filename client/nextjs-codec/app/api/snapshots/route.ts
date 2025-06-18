import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/dbConnect';
import CodeSnapshot from '@/models/CodeSnapshots';

export async function POST(request: Request) {
  try {
    await dbConnect();

    const data = await request.json();
    const snapshot = await CodeSnapshot.create({
      code: data.code,
      timestamp: data.timestamp,
      learner_id: data.learner_id,
      problemId: data.problemId,
      roomId: data.roomId,
      submissionId: data.submissionId,
      version: data.version
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Snapshot saved successfully',
      snapshot 
    });
  } catch (error: any) {
    console.error('Error saving snapshot:', error);
    return NextResponse.json(
      { success: false, message: 'Error saving snapshot', error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const learner_id = searchParams.get('learner_id');
    const problemId = searchParams.get('problemId');
    const roomId = searchParams.get('roomId');

    if (!learner_id || !problemId || !roomId) {
      return NextResponse.json(
        { success: false, message: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const snapshots = await CodeSnapshot.find({
      learner_id,
      problemId,
      roomId
    }).sort({ version: 1 });

    return NextResponse.json({ 
      success: true, 
      snapshots 
    });
  } catch (error: any) {
    console.error('Error fetching snapshots:', error);
    return NextResponse.json(
      { success: false, message: 'Error fetching snapshots', error: error.message },
      { status: 500 }
    );
  }
}