import client from '@/lib/db';
import { ObjectId } from 'mongodb';

export async function DELETE(request, { params }) {
  const commentId = params?.commentId;

  if (!commentId) {
    return Response.json(
      { message: 'Comment ID is required' },
      { status: 400 }
    );
  }

  try {
    const db = client.db('test');
    const commentsCollection = db.collection('comments');

    const result = await commentsCollection.deleteOne({
      _id: new ObjectId(commentId),
    });

    if (result.deletedCount === 0) {
      return Response.json({ message: 'Comment not found' }, { status: 404 });
    }

    return Response.json(
      { message: 'Comment deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting comment:', error);
    return Response.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
