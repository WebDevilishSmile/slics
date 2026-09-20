import { Link, Typography } from '@mui/material';
import HomeButton from '../components/layout/HomeButton';
import PageContainer from '../components/layout/PageContainer';
import LegalList from '../components/legal/LegalList';
import LegalSection from '../components/legal/LegalSection';
import LegalText from '../components/legal/LegalText';

export const metadata = {
  title: 'Terms of Service · SLICs',
};

const CONTACT_EMAIL = 'WebDevilishSmile@gmail.com';
const EFFECTIVE_DATE = 'September 20, 2026';

export default function TermsPage() {
  return (
    <PageContainer>
      <HomeButton />

      <Typography variant='sectionHeading'>Terms of Service</Typography>
      <Typography variant='body2' sx={{ mb: 4, textAlign: 'center' }}>
        Effective {EFFECTIVE_DATE}
      </Typography>

      <LegalSection title='The short version'>
        <LegalText>
          SLICs is a free tool built by a driver for drivers. Use it to look
          things up, share what you know in the comments, and be decent to each
          other. Don&apos;t use it while the truck is moving, don&apos;t treat it
          as a replacement for dispatch, and don&apos;t copy the data out of it.
          The rest of this page spells that out.
        </LegalText>
      </LegalSection>

      <LegalSection title='Agreeing to these terms'>
        <LegalText>
          By creating an account or using SLICs (&quot;the app&quot;), you agree
          to these terms and to our{' '}
          <Link href='/privacy'>Privacy Policy</Link>. If you don&apos;t agree,
          please don&apos;t use the app. The app is built and run by Tiago
          Davila (&quot;we&quot; or &quot;us&quot;).
        </LegalText>
      </LegalSection>

      <LegalSection title='Not affiliated with UPS'>
        <LegalText>
          SLICs is an independent project. It is not made, endorsed, sponsored
          or operated by UPS, and nothing in the app is an official UPS
          instruction. Your employer&apos;s policies and your dispatcher&apos;s
          directions always come first. You are responsible for making sure
          your use of the app complies with those policies.
        </LegalText>
      </LegalSection>

      <LegalSection title='Who can use the app'>
        <LegalList
          items={[
            'You must be at least 18 years old.',
            'The app is meant for working drivers and the people who support them. Please don’t create an account if you don’t need the information for your job.',
            'Give us accurate information when you sign up, and keep your password to yourself. You are responsible for everything that happens under your account, so tell us right away if you think someone else has used it.',
            'One account per person. Don’t share your login or let anyone else sign in as you.',
          ]}
        />
      </LegalSection>

      <LegalSection title='Safety first'>
        <LegalText>
          The app is designed to be used before you leave the yard or while you
          are safely parked. Never read, tap, type or scroll on it while your
          vehicle is moving. The tap-to-call and tap-for-directions links hand
          off to your phone and maps apps; follow the law and your
          employer&apos;s rules on phone use whenever you use them. You alone
          are responsible for operating your vehicle safely.
        </LegalText>
      </LegalSection>

      <LegalSection title='Accuracy of the information'>
        <LegalText>
          Addresses, phone numbers, directions PDFs and everything else in the
          app are maintained by hand, and the comments are written by other
          drivers. Locations change, entrances move, phone numbers get
          reassigned, and people make mistakes. We do our best to keep things
          current, but we can&apos;t promise that anything in the app is
          complete, correct or up to date.
        </LegalText>
        <LegalText>
          Treat the app as a convenience, not a source of truth. If something
          looks wrong, or if the app and your dispatcher disagree, go with
          dispatch, and let us know so we can fix it.
        </LegalText>
      </LegalSection>

      <LegalSection title='Comments and things you post'>
        <LegalText>
          Comments are what turn the app from an address list into shared
          knowledge, and we want you to use them. A few ground rules:
        </LegalText>
        <LegalList
          items={[
            'Keep it about the location: entrances, road restrictions, who to call, where to park, what to watch out for.',
            'Be respectful. No harassment, threats, slurs or personal attacks on other drivers, customers or anyone else.',
            'Don’t post other people’s personal information, such as a coworker’s home address or personal phone number, unless it is something they have shared for work purposes.',
            'Don’t post anything you don’t have the right to share, and nothing illegal.',
            'No spam, advertising or off-topic posts.',
          ]}
        />
        <LegalText>
          You own what you write. By posting it, you give us permission to
          store it, show it to other signed-in drivers alongside your name and
          profile picture, and keep showing it until you delete it or your
          account is removed. You can delete your own comments at any time from
          your profile page.
        </LegalText>
        <LegalText>
          We can edit or remove any comment, and suspend or close any account,
          that we believe breaks these rules or makes the app worse for other
          drivers. We aren&apos;t obliged to review every comment before it
          appears, so don&apos;t assume that a comment is accurate just because
          it&apos;s there.
        </LegalText>
      </LegalSection>

      <LegalSection title='Acceptable use'>
        <LegalText>When using the app, you agree not to:</LegalText>
        <LegalList
          items={[
            'Copy, scrape, export or redistribute the address database, PDFs or comments, in bulk or otherwise, outside the app.',
            'Use bots, scripts or automated tools to access the app, or try to get around rate limits, sign-in or other protections.',
            'Try to access accounts, admin pages or data that aren’t yours.',
            'Upload anything that contains viruses or malicious code, or do anything that disrupts the app for other people.',
            'Use the app for anything unlawful.',
          ]}
        />
      </LegalSection>

      <LegalSection title='Supporter memberships'>
        <LegalText>
          The app is free to use. If you choose to support it through Buy Me a
          Coffee, some extra features, such as the History page, unlock while
          your membership is active. A few things to know:
        </LegalText>
        <LegalList
          items={[
            'Payments are handled entirely by Buy Me a Coffee under its own terms. We never see your card details.',
            'Membership is a way of supporting the project. It doesn’t buy ownership of any data or a guarantee that any particular feature will exist forever.',
            'Supporter features may be added, changed or retired as the app evolves.',
            'Refunds and billing questions go through Buy Me a Coffee. If your membership isn’t showing up in the app, email us and we’ll sort it out.',
          ]}
        />
      </LegalSection>

      <LegalSection title='Third-party services'>
        <LegalText>
          The app links out to Google Maps, your phone&apos;s dialer and Buy Me
          a Coffee, and uses Google for sign-in. Those services belong to other
          companies and have their own terms and privacy policies. We
          aren&apos;t responsible for how they work or for what happens once
          you leave the app.
        </LegalText>
      </LegalSection>

      <LegalSection title='Our content'>
        <LegalText>
          The SLICs name, logo, design and the compiled address database are
          ours. The address of a UPS hub or a customer isn&apos;t secret, but
          the work of collecting, organizing and keeping all of it current is,
          and that is what these terms protect. You may use the app and its
          content for your own work as a driver. You may not copy it into
          another product, sell it or publish it.
        </LegalText>
      </LegalSection>

      <LegalSection title='Availability and changes'>
        <LegalText>
          We work on the app in our spare time. It may be unavailable now and
          then, and features may change, break or disappear without notice. We
          may also stop offering the app entirely. We&apos;ll try to give a
          heads-up for anything major, but we can&apos;t promise it.
        </LegalText>
      </LegalSection>

      <LegalSection title='Ending your account'>
        <LegalText>
          You can stop using the app at any time, and you can ask us to delete
          your account by emailing{' '}
          <Link href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</Link>. We
          may suspend or delete an account that breaks these terms or that has
          been used to harm the app or other drivers. If that happens,
          you&apos;ll lose access to anything tied to the account, including
          your comments and lookup history.
        </LegalText>
      </LegalSection>

      <LegalSection title='No warranties'>
        <LegalText>
          The app is provided &quot;as is&quot; and &quot;as available&quot;,
          without warranties of any kind, whether express or implied, including
          any warranty that it will be accurate, reliable, uninterrupted, error
          free or fit for a particular purpose. Some places don&apos;t allow
          these exclusions, so some of them may not apply to you.
        </LegalText>
      </LegalSection>

      <LegalSection title='Limitation of liability'>
        <LegalText>
          To the fullest extent the law allows, we are not liable for any loss
          or damage that comes from using, or not being able to use, the app.
          That includes a wrong or outdated address, a missed or late delivery,
          a fine, a ticket, disciplinary action, an accident, lost data, or
          anything a comment says. If we are found liable despite this, our
          total liability to you is limited to the amount you paid to support
          the app in the twelve months before the claim, or zero if you
          haven&apos;t paid anything.
        </LegalText>
      </LegalSection>

      <LegalSection title='Governing law'>
        <LegalText>
          These terms are governed by the laws of the Commonwealth of
          Pennsylvania, without regard to its conflict-of-law rules, no matter
          which state you use the app from. Any dispute about the app or these
          terms will be handled in the state or federal courts located in
          Pennsylvania, and you agree to the jurisdiction of those courts. The
          app is intended for use in the United States.
        </LegalText>
      </LegalSection>

      <LegalSection title='Changes to these terms'>
        <LegalText>
          We may update these terms as the app changes. When we do, we&apos;ll
          change the effective date at the top of this page. Continuing to use
          the app after a change means you accept the updated terms.
        </LegalText>
      </LegalSection>

      <LegalSection title='Contact'>
        <LegalText>
          Questions about these terms go to{' '}
          <Link href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</Link>.
        </LegalText>
      </LegalSection>
    </PageContainer>
  );
}
