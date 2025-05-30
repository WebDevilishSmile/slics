import { auth } from '@/auth'; // Adjust if you have a custom auth wrapper
import client from '@/lib/db';
import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';

export async function POST(request, { params }) {
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { voteType } = await request.json(); // "up" or "down"
  const userId = session.user.id;
  const { commentId } = params;

  if (!['up', 'down'].includes(voteType)) {
    return NextResponse.json({ message: 'Invalid vote type' }, { status: 400 });
  }

  const db = client.db();
  const comments = db.collection('comments');

  const voteField = voteType === 'up' ? 'upVotes' : 'downVotes';
  const oppositeField = voteType === 'up' ? 'downVotes' : 'upVotes';

  try {
    await comments.updateOne(
      { _id: new ObjectId(commentId) },
      {
        $addToSet: { [voteField]: userId }, // Add only if not already there
        $pull: { [oppositeField]: userId }, // Remove from opposite if exists
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Vote update error:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
