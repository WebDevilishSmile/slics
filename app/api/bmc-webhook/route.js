import client from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(req) {
  const rawBody = await req.text();
  const signature = req.headers.get('x-bmc-signature');

  // 1. Verify the signature
  const expectedSignature = crypto
    .createHmac('sha256', process.env.BMC_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');
  if (signature !== expectedSignature) {
    return new Response('Invalid signature', { status: 401 });
  }

  // 2. Parse the JSON body
  const event = JSON.parse(rawBody);
  const eventType = event.type;

  if (eventType === 'new_member') {
    const { email, payer_name } = event.data;

    const db = client.db();
    await db
      .collection('users')
      .updateOne(
        { email },
        { $set: { bmcMember: true, payer_name } },
        { upsert: true }
      );
  }
  return NextResponse.json({ received: true }, { status: 200 });
}
