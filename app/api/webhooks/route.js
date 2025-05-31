import client from '@/lib/db';
import { NextResponse } from 'next/server';

export const config = {
  api: {
    bodyParser: false, // Disable body parsing to handle raw request
  },
};

async function buffer(readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export async function POST(request) {
  const sig = request.headers.get('stripe-signature');
  const buf = await buffer(request.body);

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  const db = client.db();
  if (
    event.type === 'customer.subscription.created' ||
    event.type === 'customer.subscription.updated'
  ) {
    const subscription = event.data.object;
    const customerId = subscription.customer;
    const status = subscription.status;

    await db
      .collection('users')
      .updateOne(
        { stripeCustomerId: customerId },
        { $set: { subscriptionStatus: status } },
        { upsert: true }
      );
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
