import { auth } from '@/auth';
import client from '@/lib/db';
import { stripe } from '@/lib/stripe';
import { NextResponse } from 'next/server';

export async function POST(request) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = client.db();
  const user = await db
    .collection('users')
    .findOne({ email: session.user.email });

  let stripeCustomerId = user?.stripeCustomerId;

  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: session.user.email,
    });
    stripeCustomerId = customer.id;
    await db
      .collection('users')
      .updateOne(
        { email: session.user.email },
        { $set: { stripeCustomerId } },
        { upsert: true }
      );
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    payment_method_types: ['card'],
    mode: 'subscription',
    line_items: [
      {
        price: process.env.STRIPE_PRICE_ID, // Replace with your actual price ID
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/cancel`,
  });
  return NextResponse.json({ url: checkoutSession.url }, { status: 200 });
}
