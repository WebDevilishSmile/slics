import { redirect } from 'next/navigation';

// There's no cover overview: the admin index links Cover Drivers and Cover
// Jobs directly. A typed or old /admin/cover link lands there instead of on
// an empty page.
export default function Cover() {
  redirect('/admin');
}
