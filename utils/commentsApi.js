'use server';

import client from '@/lib/db';

export async function createComment(commentData) {
  try {
    if (!commentData.userId || !commentData.numSlic) {
      throw new Error('Comment data and user ID are required');
    }

    const db = client.db();
    const commentsCollection = db.collection('comments');

    // Create the document
    const commentDocument = {
      created_at: new Date().toISOString(),
      numSlic: commentData.numSlic,
      userId: commentData.userId,
      content: commentData.content,
      upVotes: [],
      downVotes: [],
    };

    const result = await commentsCollection.insertOne(commentDocument);

    return {
      _id: result.insertedId,
      ...commentDocument,
    };
  } catch (error) {
    console.error('Error creating comment:', error);
    throw error;
  }
}

export async function getAllComments() {
  try {
    const db = client.db();
    const commentsCollection = db.collection('comments');

    const comments = await commentsCollection.find({}).toArray();

    // Sort: by upVotes length descending, then by createdAt descending
    comments.sort((a, b) => {
      const aVotes = a.upVotes?.length || 0;
      const bVotes = b.upVotes?.length || 0;

      if (bVotes !== aVotes) return bVotes - aVotes;

      return new Date(b.created_at) - new Date(a.created_at);
    });

    return comments;
  } catch (error) {
    console.error('Error fetching all comments:', error);
    throw error;
  }
}

export async function getCommentsBySlic(numSlic) {
  try {
    if (!numSlic) {
      throw new Error('Slic ID is required');
    }

    const db = client.db();
    const commentsCollection = db.collection('comments');

    const comments = await commentsCollection
      .find({ numSlic }) // match the slic
      .toArray();

    // Sort: by upVotes length descending, then by createdAt descending
    comments.sort((a, b) => {
      const aVotes = a.upVotes?.length || 0;
      const bVotes = b.upVotes?.length || 0;

      if (bVotes !== aVotes) return bVotes - aVotes;

      return new Date(b.created_at) - new Date(a.created_at);
    });

    return comments;
  } catch (error) {
    console.error('Error fetching comments:', error);
    throw error;
  }
}

export async function deleteComment(commentId) {
  try {
    if (!commentId) {
      throw new Error('Comment ID is required');
    }

    const db = client.db();
    const commentsCollection = db.collection('comments');

    const result = await commentsCollection.deleteOne({ _id: commentId });

    if (result.deletedCount === 0) {
      throw new Error('Comment not found');
    }

    return { message: 'Comment deleted successfully' };
  } catch (error) {
    console.error('Error deleting comment:', error);
    throw error;
  }
}

export async function getCommentsByUserId(userId) {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const db = client.db();
    const commentsCollection = db.collection('comments');

    const comments = await commentsCollection.find({ userId }).toArray();

    // Sort: by upVotes length descending, then by createdAt descending
    comments.sort((a, b) => {
      return new Date(b.created_at) - new Date(a.created_at);
    });

    return comments;
  } catch (error) {
    console.error('Error fetching comments by user ID:', error);
    throw error;
  }
}
