// src/app/api/webhooks/buymeacoffee/route.js
import { NextResponse } from 'next/server';
import crypto from 'crypto'; // Node.js crypto module for HMAC verification
import clientPromise from '@/lib/db'; // Your MongoDB connection client
import { ObjectId } from 'mongodb';
import client from '@/lib/db';

// Ensure this API route runs in a Node.js environment
// This is default for API routes in App Router, but good to be explicit
export const runtime = 'nodejs';

export async function POST(req) {
  const BMC_WEBHOOK_SECRET = process.env.BMC_WEBHOOK_SECRET;

  if (!BMC_WEBHOOK_SECRET) {
    console.error('BMC_WEBHOOK_SECRET is not set in environment variables.');
    return NextResponse.json(
      { message: 'Server configuration error' },
      { status: 500 },
    );
  }

  const signature = req.headers.get('x-signature-sha256'); // Check BMC documentation for exact header name

  // Read the raw body as text for HMAC verification
  const rawBody = await req.text();

  // 1. Verify Webhook Signature (CRITICAL SECURITY STEP)
  if (!signature) {
    return NextResponse.json(
      { message: 'No signature provided' },
      { status: 401 },
    );
  }

  const hmac = crypto.createHmac('sha256', BMC_WEBHOOK_SECRET);
  hmac.update(rawBody);
  const digest = hmac.digest('hex');

  if (digest !== signature) {
    console.warn('Webhook signature mismatch!');
    return NextResponse.json({ message: 'Invalid signature' }, { status: 403 });
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch (error) {
    console.error('Error parsing webhook body:', error);
    return NextResponse.json(
      { message: 'Invalid JSON payload' },
      { status: 400 },
    );
  }

  const db = client.db();
  const usersCollection = db.collection('users');

  try {
    // --- FIX START ---
    // The actual event type is in the top-level 'type' field.
    const eventType = event.type;
    // The supporter's email is nested inside the 'data' object.
    const supporterEmail = event.data?.supporter_email; // Use optional chaining for safety

    if (!supporterEmail) {
      console.warn(
        `BMC Webhook: Event type "${eventType}" received without supporter_email in data.`,
      );
      return NextResponse.json(
        { message: 'Missing supporter_email in webhook data' },
        { status: 400 },
      );
    }
    // --- FIX END ---

    // Determine the type of event and update user status
    if (eventType === 'membership.started') {
      await usersCollection.updateOne(
        { email: supporterEmail }, // Use the correctly extracted supporterEmail
        { $set: { bmcMember: true } },
        { upsert: false }, // Do not create a new user if not found
      );
      console.log(`BMC Webhook: User ${supporterEmail} marked as BMC member.`);
    } else if (
      eventType === 'membership.cancelled' ||
      eventType === 'membership.canceled'
    ) {
      // Check for common cancellation event names
      await usersCollection.updateOne(
        { email: supporterEmail }, // Use the correctly extracted supporterEmail
        { $set: { bmcMember: false } },
        { upsert: false },
      );
      console.log(
        `BMC Webhook: User ${supporterEmail} marked as NOT a BMC member.`,
      );
    } else {
      console.log(
        `BMC Webhook: Unhandled event type: ${eventType}. No action taken.`,
      );
    }

    return NextResponse.json(
      { message: 'Webhook received and processed' },
      { status: 200 },
    );
  } catch (error) {
    console.error('BMC Webhook: Error processing webhook event:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
