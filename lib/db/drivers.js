import { ObjectId } from 'mongodb';

import client from '@/lib/db/client';
import { DRIVER_NAME_MAX_LENGTH } from '@/constants';
import { driverNameKey } from '@/lib/driverNames';
import { mergeDrivers, pickWeeksSince } from '@/lib/driverRoster';

// The building roster (`drivers`, admin-only): `{ name, employeeId,
// seniorityDate: 'YYYY-MM-DD-A', phone, created_at?, updated_at?, sheetKey?,
// notSheetKeys? }`. The letter after the date is the order within a hire date.
// The on-call sheet is kept current and the roster isn't, so /admin/drivers
// shows the sheet with the roster filling in (lib/driverRoster.js):
// `sheetKey` links a row to the sheet name an admin matched it to, and
// `notSheetKeys` are names an admin said aren't this driver.
// Employee IDs are unique (an index), and so is `sheetKey`.

const drivers = () => client.db().collection('drivers');

const EMPLOYEE_ID = /^\d{5,10}(-\d)?$/;
const SENIORITY_DATE = /^(\d{4}-\d{2}-\d{2})-[A-Z]$/;
const PHONE_MAX_LENGTH = 30;

const cleanName = (value) => (typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '');
const isRealDate = (value) =>
  !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) &&
  new Date(`${value}T00:00:00Z`).toISOString().startsWith(value);
const now = () => new Date().toISOString();

// A request body → `{ fields }` or `{ error }` for a 400. Only these four
// fields are ever written from a request (SECURITY.md #10). With `partial`,
// missing fields are left out instead of required.
export function validateDriverFields(body, { partial = false } = {}) {
  const fields = {};

  if (!partial || body?.name !== undefined) {
    const name = cleanName(body?.name);
    if (name.length < 2 || name.length > DRIVER_NAME_MAX_LENGTH) {
      return { error: `Enter a name (up to ${DRIVER_NAME_MAX_LENGTH} characters).` };
    }
    fields.name = name;
  }
  if (!partial || body?.employeeId !== undefined) {
    const employeeId = String(body?.employeeId ?? '').trim();
    if (!EMPLOYEE_ID.test(employeeId)) return { error: 'Enter the employee ID (digits).' };
    fields.employeeId = employeeId;
  }
  if (!partial || body?.seniorityDate !== undefined) {
    const seniorityDate = String(body?.seniorityDate ?? '').trim().toUpperCase();
    const date = SENIORITY_DATE.exec(seniorityDate)?.[1];
    if (!date || !isRealDate(date)) {
      return { error: 'Enter the seniority date and its letter (2001-05-01-A).' };
    }
    fields.seniorityDate = seniorityDate;
  }
  if (body?.phone !== undefined) {
    const phone = String(body.phone ?? '').trim();
    if (phone.length > PHONE_MAX_LENGTH) return { error: 'That phone number is too long.' };
    fields.phone = phone;
  } else if (!partial) {
    fields.phone = '';
  }

  return { fields };
}

const duplicateId = (employeeId) => ({
  error: `Employee ID ${employeeId} is already on the roster.`,
  status: 409,
});

/**
 * Adds a roster row from validated `fields`. `sheetName`, when given, links
 * it to that driver on the sheet ("Add details" on /admin/drivers).
 * → { driver } or { error, status }.
 */
export async function createDriver(fields, { sheetName } = {}) {
  if (await drivers().findOne({ employeeId: fields.employeeId }, { projection: { _id: 1 } })) {
    return duplicateId(fields.employeeId);
  }
  const sheetKey = sheetName ? driverNameKey(sheetName) : '';
  if (sheetKey && (await drivers().findOne({ sheetKey }, { projection: { _id: 1 } }))) {
    return { error: 'That driver already has roster details.', status: 409 };
  }

  const driver = { ...fields, created_at: now(), ...(sheetKey ? { sheetKey } : {}) };
  try {
    await drivers().insertOne(driver);
  } catch (error) {
    if (error?.code === 11000) return { error: 'That driver is already on the roster.', status: 409 };
    throw error;
  }
  return { driver };
}

// Changes a row's validated `fields`. → { driver } or { error, status }.
export async function updateDriver(driverId, fields) {
  if (!ObjectId.isValid(driverId)) return { error: 'Invalid driver.', status: 400 };
  const _id = new ObjectId(driverId);
  if (
    fields.employeeId &&
    (await drivers().findOne({ employeeId: fields.employeeId, _id: { $ne: _id } }, { projection: { _id: 1 } }))
  ) {
    return duplicateId(fields.employeeId);
  }
  try {
    const driver = await drivers().findOneAndUpdate(
      { _id },
      { $set: { ...fields, updated_at: now() } },
      { returnDocument: 'after' },
    );
    if (!driver) return { error: 'Driver not found.', status: 404 };
    return { driver };
  } catch (error) {
    if (error?.code === 11000) return duplicateId(fields.employeeId);
    throw error;
  }
}

// Links a roster row to a driver on the sheet, for a spelling the merge
// doesn't match by itself. → { driver } or { error, status }.
export async function linkDriver(driverId, sheetName) {
  if (!ObjectId.isValid(driverId)) return { error: 'Invalid driver.', status: 400 };
  const sheetKey = driverNameKey(cleanName(sheetName));
  if (!sheetKey) return { error: 'Which driver on the sheet?', status: 400 };
  const _id = new ObjectId(driverId);
  const holder = await drivers().findOne({ sheetKey, _id: { $ne: _id } }, { projection: { name: 1 } });
  if (holder) {
    return { error: `That driver is already linked to the roster row for ${holder.name}.`, status: 409 };
  }
  try {
    const driver = await drivers().findOneAndUpdate(
      { _id },
      { $set: { sheetKey, updated_at: now() }, $pull: { notSheetKeys: sheetKey } },
      { returnDocument: 'after' },
    );
    if (!driver) return { error: 'Driver not found.', status: 404 };
    return { driver };
  } catch (error) {
    if (error?.code === 11000) return { error: 'That driver is already linked.', status: 409 };
    throw error;
  }
}

// "Not the same driver": unlinks a roster row from a sheet name and keeps the
// merge from matching or suggesting the pair again. → { driver } or
// { error, status }.
export async function unlinkDriver(driverId, sheetName) {
  if (!ObjectId.isValid(driverId)) return { error: 'Invalid driver.', status: 400 };
  const sheetKey = driverNameKey(cleanName(sheetName));
  if (!sheetKey) return { error: 'Which driver on the sheet?', status: 400 };
  const _id = new ObjectId(driverId);
  const row = await drivers().findOne({ _id }, { projection: { sheetKey: 1 } });
  if (!row) return { error: 'Driver not found.', status: 404 };

  const update = { $addToSet: { notSheetKeys: sheetKey }, $set: { updated_at: now() } };
  if (row.sheetKey === sheetKey) update.$unset = { sheetKey: '' };
  const driver = await drivers().findOneAndUpdate({ _id }, update, { returnDocument: 'after' });
  return { driver };
}

// → { deleted: true } or { error, status }.
export async function deleteDriver(driverId) {
  if (!ObjectId.isValid(driverId)) return { error: 'Invalid driver.', status: 400 };
  const { deletedCount } = await drivers().deleteOne({ _id: new ObjectId(driverId) });
  if (deletedCount === 0) return { error: 'Driver not found.', status: 404 };
  return { deleted: true };
}

// /admin/drivers: the sheet's drivers with the roster merged in, and the
// roster rows on no sheet (mergeDrivers). Plain data, ready for the client.
export async function getDriverRoster() {
  const db = client.db();
  const [jobs, coverWeeks, roster] = await Promise.all([
    db
      .collection('sheet-jobs')
      .find(
        { removedAt: { $exists: false } },
        { projection: { jobName: 1, driver: 1, seniority: 1, sheetOrder: 1 } },
      )
      .sort({ sheetOrder: 1 })
      .toArray(),
    db
      .collection('cover-bid-picks')
      .find({ weekEnding: { $gte: pickWeeksSince() } }, { projection: { weekEnding: 1, rows: 1 } })
      .toArray(),
    drivers().find({}).toArray(),
  ]);
  return mergeDrivers({ jobs, coverWeeks, roster });
}
