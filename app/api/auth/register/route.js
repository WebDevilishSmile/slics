import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import client from '@/lib/db';

function initialsAvatar(first, last) {
  const initials = `${first[0].toUpperCase()}${last[0].toUpperCase()}`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40"><rect width="40" height="40" rx="20" fill="#0288d1"/><text x="20" y="20" text-anchor="middle" dominant-baseline="central" font-family="sans-serif" font-size="16" font-weight="bold" fill="white">${initials}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export async function POST(request) {
  try {
    const { email, firstName, lastName, password } = await request.json();

    if (!email || !firstName || !lastName || !password) {
      return NextResponse.json(
        { error: 'All fields are required.' },
        { status: 400 }
      );
    }

    const emailLower = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailLower)) {
      return NextResponse.json(
        { error: 'Invalid email address.' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters.' },
        { status: 400 }
      );
    }

    const db = client.db();
    const existing = await db
      .collection('users')
      .findOne({ email: emailLower });

    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email already exists.' },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const firstTrimmed = firstName.trim();
    const lastTrimmed = lastName.trim();

    await db.collection('users').insertOne({
      name: `${firstTrimmed} ${lastTrimmed}`,
      firstName: firstTrimmed,
      lastName: lastTrimmed,
      email: emailLower,
      password: hashedPassword,
      image: initialsAvatar(firstTrimmed, lastTrimmed),
      emailVerified: null,
      role: 'user',
      comments: [],
      bmcMember: false,
      created_at: new Date(),
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
