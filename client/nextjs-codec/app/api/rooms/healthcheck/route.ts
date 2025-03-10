import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';

export async function GET() {
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

