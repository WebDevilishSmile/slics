// app/api/slics/newSlic/route.js
import { createSlic } from '@/utils/slicsApi';
import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    // Optional: Check authentication
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const newSlic = await createSlic(body);

    return NextResponse.json(
      {
        success: true,
        data: newSlic,
        message: 'Slic created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('API Error creating slic:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 400 }
    );
  }
}
