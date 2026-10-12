import { Link } from '@mui/material';
import { CONTACT_EMAIL } from '@/constants';
import LegalContact from '@/components/legal/LegalContact';
import LegalList from '@/components/legal/LegalList';
import LegalPage from '@/components/legal/LegalPage';
import LegalSection from '@/components/legal/LegalSection';
import LegalSummary from '@/components/legal/LegalSummary';
import LegalText from '@/components/legal/LegalText';

export const metadata = {
  title: 'Privacy Policy · SLICs',
};

const EFFECTIVE_DATE = 'October 12, 2026';

// Every section's title, in page order, for the summary card's "On this
// page" list. Keep it in step with the LegalSection titles below.
const SECTIONS = [
  'Who we are',
  'Information you give us',
  'Information collected automatically',
  'Cookies and local storage',
  'How we use your information',
  'Who can see your information',
  'The driver roster',
  'Covers',
  'How long we keep information',
  'Your choices',
  'Security',
  'Children',
  'Changes to this policy',
  'Contact',
];

export default function PrivacyPage() {
  return (
    <LegalPage title='Privacy Policy' effective={EFFECTIVE_DATE} sections={SECTIONS}>
      <LegalSummary
        sections={SECTIONS}
        items={[
          <>
            We keep your name and email, the tips and places you post, and
            which SLICs you look up.{' '}
            <Link href='#information-you-give-us'>What we keep</Link>
          </>,
          <>
            Other drivers see your name, picture and posts, never your email,
            phone number or lookup history.{' '}
            <Link href='#who-can-see-your-information'>Who sees what</Link>
          </>,
          <>
            We never sell your information, and the app shows no ads.{' '}
            <Link href='#how-we-use-your-information'>How we use it</Link>
          </>,
          <>
            You can delete your account yourself, any time, from your profile.{' '}
            <Link href='#your-choices'>Your choices</Link>
          </>,
        ]}
      />

      <LegalSection title='Who we are'>
        <LegalText>
          SLICs is an independent web app built and run by Tiago Davila, a UPS
          Feeder driver, so that drivers can look up destination addresses,
          phone numbers and directions without a paper binder. It is not made,
          endorsed or operated by UPS.
        </LegalText>
        <LegalText>
          This policy explains what information the app collects, why, who can
          see it, and the choices you have. It applies to everything under this
          site. If you have a question that isn&apos;t answered here, email{' '}
          <Link href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</Link>.
        </LegalText>
      </LegalSection>

      <LegalSection title='Information you give us'>
        <LegalList
          items={[
            <>
              <strong>Account details.</strong> If you sign in with Google, we
              receive your name, email address and profile picture from Google.
              If you create an account with an email and password, we store
              your first name, last name and email address. Your password is
              stored only as a one-way hash, so it cannot be read back by us or
              anyone else. If you reset your password from an emailed link, we
              note that your email address is confirmed.
            </>,
            <>
              <strong>Profile details.</strong> You can optionally add a phone
              number and change your display name on your profile page.
            </>,
            <>
              <strong>Driver tips and places.</strong> The tips and replies you
              post on a SLIC, including any pin you drop on one, are stored
              with your account and the SLIC they belong to. Places you add on
              the Places page, including any parking pin you give them, and
              your comments and replies there are stored with your account
              too. So are any votes you cast on other drivers&apos; tips and
              comments.
            </>,
            <>
              <strong>Reports about a SLIC.</strong> If you use &quot;Something
              wrong with this SLIC?&quot;, what you pick and any note you write
              are stored with your account and the SLIC, so the administrator
              can check and fix it. Other drivers never see reports.
            </>,
            <>
              <strong>Driver verification.</strong> If you ask to be verified
              for covers, your name, the employee ID in your UPS email and your
              seniority date are stored with your account until the
              administrator decides your request. Nothing is sent to your UPS
              email. Once you&apos;re verified, your account is linked to your
              name as the on-call sheet writes it.
            </>,
            <>
              <strong>Notifications.</strong> If you turn on notifications on
              your profile page, we store the address your browser&apos;s push
              service gives that device, so the app can send it alerts, and
              which kinds of alert you chose, with your account. Each alert
              says only a SLIC number and what happened. Turning notifications
              off deletes the address. For 90 days we keep a record of each
              alert sent: what it said and how many devices took it, not who
              got it. Today only administrators can turn them on.
            </>,
            <>
              <strong>Messages you send us.</strong> If you email us, we keep
              the email so we can reply.
            </>,
          ]}
        />
      </LegalSection>

      <LegalSection title='Information collected automatically'>
        <LegalList
          items={[
            <>
              <strong>Lookup history.</strong> Each time you look up a SLIC while
              signed in, we record which SLIC you viewed and when. This powers
              the lookup counter on the home page and the History page for
              supporters. Notes you add to entries on the History page are
              stored with that entry, and only you can see them.
            </>,
            <>
              <strong>IP address.</strong> When you create an account, your IP
              address is used to limit how many sign-ups can come from one
              network in an hour. Those records delete themselves automatically
              once the hour is up. Our hosting provider also keeps standard
              server logs, which include IP addresses.
            </>,
            <>
              <strong>Usage and performance data.</strong> We use Vercel
              Analytics and Speed Insights to see which pages are used and how
              fast they load. These tools are cookie-free and report aggregated
              numbers; they don&apos;t identify you by name and don&apos;t track
              you across other websites.
            </>,
            <>
              <strong>Your location, only when you ask.</strong> &quot;Near
              me&quot;, &quot;Use my location&quot; and &quot;Use my current
              location&quot; ask your browser for your location only when you
              tap them. Near me uses it inside your browser to sort places by
              distance; it is never sent to or stored by the app. &quot;Use my
              location&quot; fills in a tip&apos;s pin, and &quot;Use my
              current location&quot; a place&apos;s parking pin. Either is
              saved only if you post the tip or save the place.
            </>,
          ]}
        />
      </LegalSection>

      <LegalSection title='Cookies and local storage'>
        <LegalText>
          The app uses a small number of cookies, all of which are needed for it
          to work. A session cookie keeps you signed in for up to 30 days, and a
          couple of short-lived security cookies protect the sign-in process.
          We don&apos;t use advertising cookies or any third-party tracking
          cookies.
        </LegalText>
        <LegalText>
          A few conveniences are saved only in your browser&apos;s local
          storage, on that device. The app never sends them anywhere:
        </LegalText>
        <LegalList
          items={[
            'Your light or dark mode choice, and which maps app opens your directions.',
            'The SLICs you looked up most recently, for the Recent list on the search.',
            'Which tips you have already seen on each SLIC, so new ones can be marked.',
            'The last SLIC you looked up, so the app can ask you to leave a tip about it, and whether you asked it not to for a while.',
            'Whether you dismissed the “add to home screen” reminder or the supporter note, and which app tip was shown last.',
          ]}
        />
      </LegalSection>

      <LegalSection title='How we use your information'>
        <LegalList
          items={[
            'To run the app: signing you in, showing SLIC details, saving your tips, places and profile, and building your lookup history.',
            'To show who wrote a tip or comment, so drivers know where it came from.',
            'To unlock supporter features, such as the History page, when you support the app on Buy Me a Coffee.',
            'To prevent abuse, such as scripted sign-ups or spam.',
            'To understand how the app is used and make it better.',
            'To answer your questions when you contact us.',
          ]}
        />
        <LegalText>
          We never sell your information, and the app shows no ads.
        </LegalText>
      </LegalSection>

      <LegalSection title='Who can see your information'>
        <LegalList
          items={[
            <>
              <strong>Other drivers.</strong> Any signed-in user can see your
              display name, profile picture, tips, comments and the places you
              add, and a check mark next to your name if you&apos;re a verified
              driver. They see how many votes a tip or comment has, never who
              voted. Your email, phone number, lookup history and
              verification details are never shown to other drivers.
            </>,
            <>
              <strong>The administrator.</strong> As the person running the app,
              Tiago Davila can see account details (including your email and
              phone number if you added one), tips and comments, reports about
              SLICs, lookup history and driver verification requests in order
              to keep the app working, moderate what drivers post and verify
              drivers, and the support you send through Buy Me a Coffee.
            </>,
            <>
              <strong>Service providers.</strong> The app runs on Vercel
              (hosting, analytics and file storage for directions PDFs) and
              stores its data in MongoDB Atlas. Google handles Google sign-in.
              Resend sends our emails, which today are only password reset
              emails: it receives your email address and the message when you
              ask for one. If notifications are on, alerts reach your device
              through your browser maker&apos;s push service (Google, Apple or
              Mozilla). Buy Me a Coffee processes supporter payments. For each one it tells
              us your email address and name, the amount, any message you leave
              and when a membership starts or ends. We never receive your
              payment details.
            </>,
            <>
              <strong>When the law requires it.</strong> We may disclose
              information if we are legally required to.
            </>,
          ]}
        />
        <LegalText>
          Tapping an address or phone number hands it to your maps or phone
          app. What happens from there is covered by that app&apos;s own
          privacy policy.
        </LegalText>
      </LegalSection>

      <LegalSection title='The driver roster'>
        <LegalText>
          For the cover and bid features, the administrator keeps a list of
          drivers in the building with each driver&apos;s name, employee ID,
          seniority date and phone number. This list can include drivers who
          have never created an account. It is matched against the names and
          seniority on the drivers&apos; on-call sheet to keep it current. Only
          the administrator sees it, to help check verification requests. If
          you are on the roster and want
          your entry corrected or removed, email us.
        </LegalText>
      </LegalSection>

      <LegalSection title='Covers'>
        <LegalText>
          The Covers page is for verified drivers. It shows which cover jobs
          are still open and which are taken, never who took them, and your own
          place and call-in time on the week&apos;s list. It never shows you
          another driver&apos;s picks or why they are off.
        </LegalText>
      </LegalSection>

      <LegalSection title='How long we keep information'>
        <LegalList
          items={[
            'Account and profile details are kept for as long as your account exists.',
            'Tips and comments are kept until you delete them, or until your account is deleted. Delete a tip from the SLIC or your profile page, and a comment on a place from the place itself.',
            'Places you add stay after your account is deleted, without your name, because other drivers rely on them.',
            'Reports about a SLIC are kept after they are dealt with, as a record of what was fixed. If you delete your account they stay, no longer linked to you.',
            'Lookup history is kept while your account exists. Removing an entry from the History page hides it there, but it still counts toward your lookup total. All of it is deleted with your account.',
            'A driver verification request keeps your employee ID and seniority date only until the administrator decides it; then they are deleted. The request is deleted with your account. Your verification lasts until your account is deleted or the administrator removes it.',
            "A record of each support or membership change you make through Buy Me a Coffee is kept as the app's record of support. If you delete your account it stays, no longer linked to you; ask us to remove it.",
            'Rate-limit records for signing up, signing in and password resets, which can hold the email address you typed, expire automatically within about an hour.',
            'A password reset link is kept only as a one-way hash, and only until it is used or expires: 30 minutes for a link sent by email, 24 hours for one from the administrator.',
            'Session cookies expire after 30 days, or as soon as you sign out.',
          ]}
        />
      </LegalSection>

      <LegalSection title='Your choices'>
        <LegalList
          items={[
            <>
              <strong>Delete your account yourself.</strong> On your profile
              page, tap the gear next to your name, then &quot;Delete
              account&quot;. It&apos;s immediate, signs you out on every
              device, and deletes your account, tips, comments, votes and
              lookup history, as{' '}
              <Link href='/terms#ending-your-account'>the terms</Link> spell
              out.
            </>,
            'Edit your display name and phone number, or delete any of your tips, from your profile page.',
            'Edit or delete your comments on places, and the places you added, on the Places page.',
            'Turn notifications off on your profile page to delete that device’s push address.',
            'Sign out from any device to end that session.',
            'If you signed in with Google, you can also remove SLICs from the apps connected to your Google account.',
            <>
              Email{' '}
              <Link href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</Link> to
              ask for a copy of the information we hold about you, to have an
              entry on the driver roster corrected or removed, or if deleting
              your account doesn&apos;t work.
            </>,
          ]}
        />
      </LegalSection>

      <LegalSection title='Security'>
        <LegalText>
          The site is served over HTTPS, passwords are stored as one-way
          hashes, and administrator-only actions are checked on the server on
          every request. No system is perfectly secure, so please use a
          password you don&apos;t use anywhere else and let us know right away
          if you think your account has been accessed by someone else.
        </LegalText>
      </LegalSection>

      <LegalSection title='Children'>
        <LegalText>
          SLICs is a tool for working drivers and is not intended for anyone
          under 18. We don&apos;t knowingly collect information from children;
          if you believe a child has created an account, email us and we will
          remove it.
        </LegalText>
      </LegalSection>

      <LegalSection title='Changes to this policy'>
        <LegalText>
          If the app starts collecting or sharing information in a new way,
          this page will be updated and the effective date at the top will
          change. Continuing to use the app after a change means you accept the
          updated policy.
        </LegalText>
      </LegalSection>

      <LegalContact>
        Questions, corrections and deletion requests all go to{' '}
        <Link href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</Link>.
      </LegalContact>
    </LegalPage>
  );
}
