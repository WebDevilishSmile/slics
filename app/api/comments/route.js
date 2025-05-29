import { getCommentsBySlic } from '@/utils/commentsApi';

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const numSlic = url.searchParams.get('slic');

    if (!numSlic) {
      return Response.json({ error: 'Slic ID is required' });
    }

    const comments = await getCommentsBySlic(numSlic);

    return Response.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    return Response.json({ error: 'Failed to fetch comments' });
  }
}
