'use server';

import client from '@/lib/db';
import { ObjectId } from 'mongodb';

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

    // upVotes is an array of user IDs, not a count, so sorting requires
    // computing its size — a raw `sort({ upVotes: -1 })` would sort by
    // array element value, not vote count.
    const comments = await commentsCollection
      .aggregate([
        { $match: { numSlic } },
        { $addFields: { upVoteCount: { $size: { $ifNull: ['$upVotes', []] } } } },
        { $sort: { upVoteCount: -1, created_at: -1 } },
        { $unset: 'upVoteCount' },
      ])
      .toArray();

    return comments;
  } catch (error) {
    console.error('Error fetching comments:', error);
    throw error;
  }
}

/**
 * Resolves a comment's upVotes/downVotes (arrays of user-ID strings) into
 * public profiles. Projects to { _id, name, image } only — same rule as
 * getPublicUserById — because the full user document carries the password
 * hash and email. Returns null if the comment doesn't exist.
 */
export async function getCommentVoters(commentId) {
  try {
    if (!commentId || !ObjectId.isValid(commentId)) {
      return null;
    }

    const db = client.db();
    const comment = await db
      .collection('comments')
      .findOne(
        { _id: new ObjectId(commentId) },
        { projection: { upVotes: 1, downVotes: 1 } }
      );

    if (!comment) {
      return null;
    }

    const upVotes = (comment.upVotes ?? []).filter((id) => ObjectId.isValid(id));
    const downVotes = (comment.downVotes ?? []).filter((id) =>
      ObjectId.isValid(id)
    );

    const uniqueIds = [...new Set([...upVotes, ...downVotes])];
    const users =
      uniqueIds.length === 0
        ? []
        : await db
            .collection('users')
            .find(
              { _id: { $in: uniqueIds.map((id) => new ObjectId(id)) } },
              { projection: { name: 1, image: 1 } }
            )
            .toArray();

    const usersById = Object.fromEntries(
      users.map((u) => [u._id.toString(), u])
    );

    // Keep vote order; drop IDs whose user no longer exists.
    const toProfiles = (ids) => ids.map((id) => usersById[id]).filter(Boolean);

    return {
      upVoters: toProfiles(upVotes),
      downVoters: toProfiles(downVotes),
    };
  } catch (error) {
    console.error('Error fetching comment voters:', error);
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
