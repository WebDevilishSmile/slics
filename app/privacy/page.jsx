import { Link, Typography } from '@mui/material';
import HomeButton from '../components/layout/HomeButton';
import PageContainer from '../components/layout/PageContainer';
import LegalList from '../components/legal/LegalList';
import LegalSection from '../components/legal/LegalSection';
import LegalText from '../components/legal/LegalText';

export const metadata = {
  title: 'Privacy Policy · SLICs',
};

const CONTACT_EMAIL = 'WebDevilishSmile@gmail.com';
const EFFECTIVE_DATE = 'September 20, 2026';

export default function PrivacyPage() {
  return (
    <PageContainer>
      <HomeButton />

      <Typography variant='sectionHeading'>Privacy Policy</Typography>
      <Typography variant='body2' sx={{ mb: 4, textAlign: 'center' }}>
        Effective {EFFECTIVE_DATE}
      </Typography>

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
              anyone else.
            </>,
            <>
              <strong>Profile details.</strong> You can optionally add a phone
              number and change your display name on your profile page.
            </>,
            <>
              <strong>Comments.</strong> Anything you post on a SLIC is stored
              with your account and the SLIC it belongs to, along with any votes
              you cast on other drivers&apos; comments.
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
              supporters.
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
          ]}
        />
      </LegalSection>

      <LegalSection title='Cookies and local storage'>
        <LegalText>
          The app uses a small number of cookies, all of which are needed for it
          to work. A session cookie keeps you signed in for up to 30 days, and a
          couple of short-lived security cookies protect the sign-in process.
          Your light or dark theme choice, and whether you&apos;ve dismissed the
          &quot;add to home screen&quot; reminder, are saved in your
          browser&apos;s local storage. We don&apos;t use advertising cookies or
          any third-party tracking cookies.
        </LegalText>
      </LegalSection>

      <LegalSection title='How we use your information'>
        <LegalList
          items={[
            'To run the app: signing you in, showing SLIC details, saving your comments and profile, and building your lookup history.',
            'To show who wrote a comment, so drivers know where a tip came from.',
            'To unlock supporter features, such as the History page, when you support the app on Buy Me a Coffee.',
            'To prevent abuse, such as scripted sign-ups or comment spam.',
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
              display name, profile picture, comments and votes. Your email,
              phone number and lookup history are never shown to other drivers.
            </>,
            <>
              <strong>The administrator.</strong> As the person running the app,
              Tiago Davila can see account details (including your email and
              phone number if you added one), comments and lookup history in
              order to keep the app working and moderate comments.
            </>,
            <>
              <strong>Service providers.</strong> The app runs on Vercel
              (hosting, analytics and file storage for directions PDFs) and
              stores its data in MongoDB Atlas. Google handles Google sign-in.
              Buy Me a Coffee processes supporter payments; we receive only your
              email address and the start or end of a membership, never your
              payment details.
            </>,
            <>
              <strong>Google Gemini.</strong> The cover-bid tool lets the
              administrator upload photos or PDFs of the weekly dispatch bid
              sheet, which are sent to Google&apos;s Gemini API to read the job
              rows. Those sheets can include driver names.
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
          have never created an account. It is visible only to signed-in
          drivers whose account has been linked to a roster entry. If you are
          on the roster and want your entry corrected or removed, email us.
        </LegalText>
      </LegalSection>

      <LegalSection title='How long we keep information'>
        <LegalList
          items={[
            'Account and profile details are kept for as long as your account exists.',
            'Comments are kept until you delete them from your profile page, or until your account is deleted.',
            'Lookup history is kept while your account exists. The History page shows the most recent six months.',
            'Sign-up rate-limit records expire automatically within about an hour.',
            'Session cookies expire after 30 days, or as soon as you sign out.',
          ]}
        />
      </LegalSection>

      <LegalSection title='Your choices'>
        <LegalList
          items={[
            'Edit your display name and phone number, or delete any of your comments, from your profile page.',
            'Sign out from any device to end that session.',
            'If you signed in with Google, you can also remove SLICs from the apps connected to your Google account.',
            <>
              Email{' '}
              <Link href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</Link> to
              ask for a copy of the information we hold about you, or to have
              your account and everything tied to it deleted, including your
              comments and lookup history.
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

      <LegalSection title='Contact'>
        <LegalText>
          Questions, corrections and deletion requests all go to{' '}
          <Link href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</Link>.
        </LegalText>
      </LegalSection>
    </PageContainer>
  );
}
