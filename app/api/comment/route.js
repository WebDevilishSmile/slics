import client from '@/lib/db';
import { createComment } from '@/utils/commentsApi';
import { ObjectId } from 'mongodb';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, numSlic, content } = body;

    if (!userId || !numSlic || !content) {
      return Response.json({
        error: 'User ID, Slic ID, and content are required',
      });
    }

    const commentData = {
      userId,
      numSlic,
      content,
      created_at: new Date().toISOString(),
    };

    const result = await createComment(commentData);

    return Response.json(result);
  } catch (error) {
    console.error('Error creating comment:', error);
    return Response.json({ error: 'Failed to create comment' });
  }
}
export async function DELETE(request) {
  try {
    const { commentId } = await request.json();

    if (!commentId || !ObjectId.isValid(commentId)) {
      return NextResponse.json(
        { error: 'A valid Comment ID is required' },
        { status: 400 }
      );
    }

    try {
      const db = client.db();
      const result = await db
        .collection('comments')
        .deleteOne({ _id: new ObjectId(commentId) });

      if (result.deletedCount === 0) {
        return NextResponse.json(
          { error: 'Comment not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, result });
    } catch (error) {
      console.error('Error deleting comment:', error);
      return NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json({ error: 'Failed to delete comment' });
  }
}
