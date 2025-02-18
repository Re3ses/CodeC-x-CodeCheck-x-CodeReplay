import { NextResponse } from 'next/server';
import dbConnect from '../../../lib/dbConnect';
import LiveCodeReqeust from '@/models/LiveCode';

export async function GET() {
  try {
    await dbConnect();

    const LiveCodeRequests = await LiveCodeReqeust.find();

    return NextResponse.json({
      message: 'Connected!',
      liveCode_requests: LiveCodeRequests,
    });
  } catch (e) {
    return NextResponse.json(e, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();

    const formData = await request.formData();

    const liveCodeRequest = new LiveCodeReqeust({
      request_reason: formData.get('request_reason'),
      room_slug: formData.get('room_slug'),
      problem_slug: formData.get('problem_slug'),
    });

    await liveCodeRequest.save();

    return NextResponse.json({
      message: 'Request created',
      liveCode_request: liveCodeRequest,
    });
  } catch (e) {
    return NextResponse.json(e, { status: 500 });
  }
}
