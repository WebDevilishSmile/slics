import { Alert, Box, Paper, Typography } from '@mui/material';

import ComposeEmail from '@/components/admin/hub/ComposeEmail';
import HubSection from '@/components/admin/hub/HubSection';
import SentEmails from '@/components/admin/hub/SentEmails';
import { getSession, isSuperAdmin } from '@/lib/authz';
import { getSentEmails } from '@/lib/db/adminAudit';
import { getEmailRecipients } from '@/lib/db/users';
import theme from '@/theme';

// Write an email from tiago@slics.app in the account emails' look
// (docs/archive/SUPER-ADMIN-HUB.md "Email", POST /api/emails), and the ones sent so
// far. Super admin only; checked here before reading anything. `?to=` puts
// an address in "To" (the email links on /admin/users).
export default async function EmailPage({ searchParams }) {
  const session = await getSession();
  if (!isSuperAdmin(session)) return null;

  let sent = null;
  try {
    sent = await getSentEmails();
  } catch (error) {
    console.error('Error loading the sent emails:', error);
  }
  // Every account's name and email, for the "To" picker. Without them the
  // field still takes a typed address.
  let people = [];
  try {
    people = await getEmailRecipients();
  } catch (error) {
    console.error('Error loading the email recipients:', error);
  }

  const { to } = await searchParams;

  return (
    <>
      <Typography variant='sectionHeading'>Email</Typography>
      <Paper
        variant='panel'
        sx={{ maxWidth: theme.layout.width.page, minHeight: 0, alignItems: 'stretch', px: { xs: 2, md: 3 }, py: 3 }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 5, width: '100%' }}>
          <HubSection
            id='email-write'
            title='Write an email'
            description='It goes out through Resend in the same look as the sign-up and password emails.'
          >
            <ComposeEmail people={people} initialTo={typeof to === 'string' ? to : ''} />
          </HubSection>
          <HubSection id='email-sent' title='Sent'>
            {sent ? (
              <SentEmails emails={sent} />
            ) : (
              <Alert severity='error'>Couldn&apos;t load the sent emails. Try again in a moment.</Alert>
            )}
          </HubSection>
        </Box>
      </Paper>
    </>
  );
}
