import client from '@/lib/db';
import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export async function POST(request) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.user.role !== 'admin')
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });

  try {
    const { name, employeeId, seniorityDate, phone } = await request.json();

    if (!name?.trim() || !employeeId?.toString().trim() || !seniorityDate?.trim()) {
      return NextResponse.json(
        { error: 'Name, Employee ID, and Seniority Date are required.' },
        { status: 400 }
      );
    }

    const db = client.db();

    const existing = await db
      .collection('drivers')
      .findOne({ employeeId: employeeId.toString().trim() });

    if (existing) {
      return NextResponse.json(
        { error: 'A driver with this Employee ID already exists.' },
        { status: 409 }
      );
    }

    const result = await db.collection('drivers').insertOne({
      name: name.trim(),
      employeeId: employeeId.toString().trim(),
      seniorityDate: seniorityDate.trim(),
      phone: phone?.trim() || '',
    });

    return NextResponse.json({ _id: result.insertedId }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}
