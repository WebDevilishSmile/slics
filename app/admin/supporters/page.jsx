import { redirect } from 'next/navigation';

// Moved under the super admin's pages on 2026-10-10.
export default function OldSupportersPage() {
  redirect('/admin/super/supporters');
}
