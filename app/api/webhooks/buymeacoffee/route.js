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
      { status: 500 }
    );
  }

  const signature = req.headers.get('x-signature-sha256'); // Check BMC documentation for exact header name

  // Read the raw body as text for HMAC verification
  const rawBody = await req.text();

  // 1. Verify Webhook Signature (CRITICAL SECURITY STEP)
  if (!signature) {
    return NextResponse.json(
      { message: 'No signature provided' },
      { status: 401 }
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
      { status: 400 }
    );
  }

  const db = client.db();
  const usersCollection = db.collection('users');

  console.log('Received BMC Webhook Event:', event);

  try {
    // Determine the type of event and update user status
    if (
      event.event_name === 'membership_started' ||
      event.event_name === 'monthly_support_started'
    ) {
      const email = event.supporter_email; // Assuming BMC provides the payer's email
      if (email) {
        await usersCollection.updateOne(
          { email: email },
          { $set: { bmcMember: true } },
          { upsert: false } // Do not create a new user if not found
        );
        console.log(`User ${email} marked as BMC member.`);
      } else {
        console.warn(
          'BMC webhook received without supporter_email for membership_started event.'
        );
      }
    } else if (
      event.event_name === 'membership_cancelled' ||
      event.event_name === 'monthly_support_cancelled'
    ) {
      const email = event.supporter_email;
      if (email) {
        await usersCollection.updateOne(
          { email: email },
          { $set: { bmcMember: false } },
          { upsert: false }
        );
        console.log(`User ${email} marked as NOT a BMC member.`);
      } else {
        console.warn(
          'BMC webhook received without supporter_email for membership_cancelled event.'
        );
      }
    }
    // Add more conditions for other event types if needed (e.g., 'monthly_support_updated')

    return NextResponse.json(
      { message: 'Webhook received and processed' },

      { status: 200 }
    );
  } catch (error) {
    console.error('Error processing BMC webhook:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
