import {
  ChatBubbleOutline,
  ContentCopy,
  DirectionsOutlined,
  InstallMobileOutlined,
  LoginOutlined,
  MenuOutlined,
  OutlinedFlag,
  PhoneOutlined,
  PictureAsPdfOutlined,
  RateReviewOutlined,
  SearchOutlined,
  ThumbUpOutlined,
} from '@mui/icons-material';
import { Box } from '@mui/material';

// The words on a button or label, as the driver sees them on screen.
function Tap({ children }) {
  return (
    <Box component='strong' sx={{ color: 'primary.main', fontWeight: 700 }}>
      {children}
    </Box>
  );
}

// The how-to guides on /help, grouped as the page shows them. Each guide's
// `id` is its anchor (/help#navigate), so a link to one guide can be texted
// to a driver. Steps are short, one action each, and name buttons exactly as
// the app labels them, so keep them in step with the UI when a label changes.
export const HELP_SECTIONS = [
  {
    id: 'getting-started',
    title: 'Getting started',
    guides: [
      {
        id: 'sign-in',
        title: 'Sign in for the first time',
        icon: LoginOutlined,
        steps: [
          <>
            Open the SLICs link on your phone and tap <Tap>Sign in</Tap>.
          </>,
          <>
            If you use Gmail, tap <Tap>Continue with Google</Tap> and pick your
            account. That&apos;s it. Skip to step 5.
          </>,
          <>
            No Gmail? Under &ldquo;or continue with email&rdquo;, tap{' '}
            <Tap>Create one</Tap>.
          </>,
          <>
            Type your first name, last name, email and a password (at least 8
            letters or numbers). Type the password again, then tap{' '}
            <Tap>Create Account</Tap>.
          </>,
          <>
            You&apos;ll see a welcome message. Tap <Tap>Use SLICs now</Tap> to
            start looking up SLICs.
          </>,
        ],
        notes: [
          <>
            Next time, type your email and password and tap <Tap>Sign In</Tap>.
            Most phones stay signed in, so you may not need to.
          </>,
          <>
            Forgot your password? Ask the SLICs admin for a reset link. Open
            it, type a new password twice and tap <Tap>Change password</Tap>.
            Then sign in with the new one. The link works once, for 24 hours.
          </>,
        ],
      },
      {
        id: 'install',
        title: 'Put SLICs on your home screen',
        icon: InstallMobileOutlined,
        intro: 'Then SLICs opens with one tap, like any other app.',
        steps: [
          <>
            <strong>iPhone:</strong> open SLICs in Safari. Tap the{' '}
            <Tap>Share</Tap> button (a square with an arrow pointing up) at the
            bottom of the screen.
          </>,
          <>
            Scroll down and tap <Tap>Add to Home Screen</Tap>, then tap{' '}
            <Tap>Add</Tap>.
          </>,
          <>
            <strong>Android:</strong> when SLICs says &ldquo;Add SLICs to your
            home screen&rdquo;, tap <Tap>Install</Tap>. Or open the menu (
            <MenuOutlined fontSize='inherit' sx={{ verticalAlign: '-0.15em' }} />{' '}
            at the top left) and tap <Tap>Install app</Tap>.
          </>,
          <>Look for the SLICs icon on your home screen and tap it.</>,
        ],
        notes: [
          <>
            The first time you open it from the home screen, you&apos;ll be
            asked to sign in again. That&apos;s normal.
          </>,
        ],
      },
      {
        id: 'menu',
        title: 'Find your way around',
        icon: MenuOutlined,
        steps: [
          <>
            Tap the menu button (three lines) at the top left of the screen.
          </>,
          <>
            <Tap>Look up a SLIC</Tap> takes you to the search.{' '}
            <Tap>All Hubs</Tap> shows only UPS buildings.
          </>,
          <>
            <Tap>Profile</Tap> shows your account and the tips you&apos;ve
            posted. <Tap>Help</Tap> brings you back to this page.
          </>,
          <>
            Driving at night? Turn on <Tap>Dark mode</Tap> near the bottom of
            the menu.
          </>,
          <>To close the menu, tap the X or anywhere outside it.</>,
        ],
      },
    ],
  },
  {
    id: 'looking-up',
    title: 'Looking up a SLIC',
    guides: [
      {
        id: 'search',
        title: 'Look up a SLIC',
        icon: SearchOutlined,
        steps: [
          <>
            Tap the search bar that says <Tap>SLIC, code or name</Tap>.
          </>,
          <>
            Type the SLIC number dispatch gave you, like 1809. You can also
            type the letter code, the customer&apos;s name or the town.
          </>,
          <>Tap the right one in the list.</>,
          <>
            The card shows the name, the SLIC number and the address. It also
            says <Tap>Center</Tap> for a UPS building or <Tap>Customer</Tap>.
          </>,
        ],
        notes: [
          <>
            Tap the search bar before you type. The SLICs you looked up lately
            show at the top under &ldquo;Recent&rdquo;.
          </>,
        ],
      },
      {
        id: 'navigate',
        title: 'Get directions',
        icon: DirectionsOutlined,
        steps: [
          <>Look up the SLIC.</>,
          <>
            Tap the big blue <Tap>Navigate</Tap> button. The address opens in
            your maps app.
          </>,
          <>
            Tap <Tap>Start</Tap> in the maps app and drive.
          </>,
        ],
        notes: [
          <>
            On an iPhone, the small button next to Navigate picks Google Maps
            or Apple Maps. SLICs remembers your choice.
          </>,
          <>
            Check the driver tips before you leave. They warn about low
            bridges, wrong entrances and roads to avoid.
          </>,
        ],
      },
      {
        id: 'call',
        title: 'Call the building',
        icon: PhoneOutlined,
        steps: [
          <>Look up the SLIC.</>,
          <>
            Tap <Tap>Call</Tap> under the Navigate button. Your phone dials
            that building&apos;s dispatch.
          </>,
        ],
        notes: [
          <>
            Only UPS buildings have a Call button. If you need a number for a
            customer, check the driver tips.
          </>,
        ],
      },
      {
        id: 'copy',
        title: 'Copy the address',
        icon: ContentCopy,
        steps: [
          <>Look up the SLIC.</>,
          <>
            Tap the copy button next to the address. It turns into a check
            mark when it&apos;s copied.
          </>,
          <>
            Open the other app, press and hold where you want the address,
            and tap <Tap>Paste</Tap>.
          </>,
        ],
      },
      {
        id: 'pdf',
        title: 'Open the directions PDF',
        icon: PictureAsPdfOutlined,
        steps: [
          <>Look up the SLIC.</>,
          <>
            If you see a <Tap>PDF</Tap> button, tap it. The directions sheet
            opens.
          </>,
          <>Pinch with two fingers to zoom in. Use your phone&apos;s back button to return.</>,
        ],
        notes: [<>Not every SLIC has a PDF. No button means there isn&apos;t one yet.</>],
      },
    ],
  },
  {
    id: 'tips',
    title: 'Driver tips & reports',
    guides: [
      {
        id: 'read-tips',
        title: 'Read driver tips',
        icon: ChatBubbleOutline,
        intro: 'Tips are notes from other drivers who have been there.',
        steps: [
          <>Look up the SLIC.</>,
          <>
            Tap <Tap>Tips</Tap>, or scroll down to &ldquo;Driver tips&rdquo;.
            The number on the button is how many tips there are. A red number
            means there are new ones since you last looked.
          </>,
          <>
            Tap <Tap>Top</Tap> for the most helpful tips first, or{' '}
            <Tap>Newest</Tap> for the latest.
          </>,
        ],
        notes: [
          <>
            Each tip says how long ago it was posted. A gate code from last
            year may not work anymore.
          </>,
        ],
      },
      {
        id: 'post-tip',
        title: 'Post a tip',
        icon: RateReviewOutlined,
        intro: 'Know where the real entrance is, or who to call? Help the next driver.',
        steps: [
          <>Look up the SLIC and scroll down to &ldquo;Driver tips&rdquo;.</>,
          <>
            Tap a topic to get started, like <Tap>Parking</Tap> or{' '}
            <Tap>Gate / guard</Tap>. Or just tap the box.
          </>,
          <>Type your tip. Keep it short and clear.</>,
          <>
            Tap <Tap>Post tip</Tap>.
          </>,
        ],
        notes: [
          <>
            Want to mark an exact spot, like a hidden gate? Tap{' '}
            <Tap>Add pin</Tap>. If you&apos;re standing there, tap{' '}
            <Tap>Use my location</Tap>.
          </>,
          <>
            After you look up a SLIC, the app may ask &ldquo;How was
            it?&rdquo; when you come back. Tap <Tap>Leave a tip</Tap>,{' '}
            <Tap>Not now</Tap>, or <Tap>Don&apos;t ask again for 2 weeks</Tap>.
          </>,
        ],
      },
      {
        id: 'vote',
        title: 'Vote, reply, or change your tip',
        icon: ThumbUpOutlined,
        steps: [
          <>
            Tip helped? Tap the thumbs up. Tip is wrong? Tap the thumbs down.
            Tap it again to take your vote back.
          </>,
          <>
            Tap <Tap>Reply</Tap> to answer a tip, like &ldquo;still true as of
            today.&rdquo;
          </>,
          <>
            On your own tips, tap the pencil to change it, or the trash can to
            delete it.
          </>,
        ],
      },
      {
        id: 'report',
        title: 'Report a wrong address or phone number',
        icon: OutlinedFlag,
        intro: 'Reports go to the admin, who fixes the SLIC for everyone.',
        steps: [
          <>Look up the SLIC.</>,
          <>
            Under the card, tap <Tap>Something wrong with this SLIC?</Tap>
          </>,
          <>
            Pick what&apos;s wrong: <Tap>Wrong phone number</Tap>,{' '}
            <Tap>Wrong address</Tap>, <Tap>Closed or moved</Tap>, or{' '}
            <Tap>Something else</Tap>.
          </>,
          <>
            Add a note if you can, like the new phone number. For
            &ldquo;Something else&rdquo;, a note is required.
          </>,
          <>
            Tap <Tap>Send report</Tap>. You&apos;ll see &ldquo;Thanks. An admin
            will check it.&rdquo;
          </>,
        ],
        notes: [
          <>
            Tips are for other drivers. Reports are for fixing the address or
            phone number on the card.
          </>,
        ],
      },
    ],
  },
];
