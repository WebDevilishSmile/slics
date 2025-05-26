import { deleteSlic } from '@/utils/slicsApi';

export async function DELETE(request, { params }) {
  try {
    console.log(params.id);

    const result = await deleteSlic(params.id);
    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}
