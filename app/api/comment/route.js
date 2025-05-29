import { createComment } from '@/utils/commentsApi';

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
