import client from '@/lib/db';
import { NextResponse } from 'next/server';

// 1. Handle the "Preflight" OPTIONS request
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    }
  );
}

// 2. Your actual GET request
export async function GET() {
  try {
    const db = client.db();
    const slicData = await db.collection('slics').find({}).toArray();

    return NextResponse.json(slicData, {
      headers: {
        'Access-Control-Allow-Origin': '*', // Allows your Expo port 8081
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
