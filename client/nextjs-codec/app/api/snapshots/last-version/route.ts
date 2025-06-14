import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import CodeSnapshot from '@/models/CodeSnapshots';

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

    const lastSnapshot = await CodeSnapshot.findOne({
      learner_id,
      problemId,
      roomId
    }).sort({ version: -1 });

    return NextResponse.json({ 
      success: true,
      lastVersion: lastSnapshot ? lastSnapshot.version : 0
    });
  } catch (error: any) {
    console.error('Error fetching last version:', error);
    return NextResponse.json(
      { success: false, message: 'Error fetching last version', error: error.message },
      { status: 500 }
    );
  }
}