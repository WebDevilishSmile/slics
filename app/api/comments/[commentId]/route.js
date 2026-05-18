import client from '@/lib/db';
import { auth } from '@/auth';
import { ObjectId } from 'mongodb';
import { NextResponse } from 'next/server';

export async function DELETE(request, { params }) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { commentId } = await params;

  if (!commentId || !ObjectId.isValid(commentId))
    return NextResponse.json({ error: 'Invalid comment ID' }, { status: 400 });

  try {
    const db = client.db('test');
    const commentsCollection = db.collection('comments');

    const comment = await commentsCollection.findOne({ _id: new ObjectId(commentId) });

    if (!comment)
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });

    const isOwner = comment.userId?.toString() === session.user.id?.toString();
    const isAdmin = session.user.role === 'admin';

    if (!isOwner && !isAdmin)
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await commentsCollection.deleteOne({ _id: new ObjectId(commentId) });

    return NextResponse.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
