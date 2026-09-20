import { auth } from '@/auth';
import { getCommentsBySlic } from '@/utils/commentsApi';
import { getSlicByNumSlic } from '@/utils/slicsApi';

export async function GET(request) {
  const session = await auth();
  if (!session)
    return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const url = new URL(request.url);
    const numSlic = url.searchParams.get('slic');

    if (!numSlic) {
      return Response.json({ error: 'Slic ID is required' });
    }

    const comments = await getCommentsBySlic(numSlic);

    let slicName = null;
    try {
      const slic = await getSlicByNumSlic(numSlic);
      slicName = slic?.name || slic.alphaSlic;
    } catch (error) {
      // Slic may not exist (e.g. deleted) — comments can still be shown.
    }

    return Response.json({ comments, slicName });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return Response.json({ error: 'Failed to fetch comments' });
  }
}
