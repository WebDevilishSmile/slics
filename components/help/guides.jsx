import {
  AddLocationAltOutlined,
  ChatBubbleOutline,
  ContentCopy,
  DirectionsOutlined,
  ForumOutlined,
  InstallMobileOutlined,
  LockResetOutlined,
  LoginOutlined,
  MenuOutlined,
  OutlinedFlag,
  PhoneOutlined,
  PictureAsPdfOutlined,
  RateReviewOutlined,
  SearchOutlined,
  SignpostOutlined,
  ThumbUpOutlined,
} from '@mui/icons-material';
import { Box, Link } from '@mui/material';

import { CONTACT_EMAIL } from '@/constants';

// The words on a button or label, as the driver sees them on screen. Bold in
// the text color, not brand blue: blue on this page means a link you can tap.
function Tap({ children }) {
  return (
    <Box component='strong' sx={{ color: 'text.primary', fontWeight: 700 }}>
      {children}
    </Box>
  );
}

// The how-to guides on /help, grouped as the page shows them. Each guide's
// `id` is its anchor (/help#navigate), so a link to one guide can be texted
// to a driver. Steps are short, one action each, and name buttons exactly as
// the app labels them, so keep them in step with the UI when a label changes.
// `screen` names the picture the guide shows, with its control lit: a control
// on the example SLIC card (ExampleSlicCard.jsx) or one of HelpScreens.jsx.
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
            On your phone, go to <strong>www.slics.app</strong> and tap{' '}
            <Tap>Sign in or sign up</Tap>.
          </>,
          <>
            If you use Gmail, tap <Tap>Continue with Google</Tap> and pick your
            account. That&apos;s it. Skip to step 5.
          </>,
          <>
            No Gmail? Under &ldquo;or use your email&rdquo;, tap{' '}
            <Tap>Create one</Tap>.
          </>,
          <>
            Type your first name, last name, email and a password (at least 8
            letters or numbers). Tap the eye to check what you typed, then
            tap <Tap>Create account</Tap>.
          </>,
          <>
            SLICs opens on the lookup page. Type a SLIC code to look one up.
          </>,
        ],
        notes: [
          <>
            Next time, type your email and password and tap <Tap>Sign in</Tap>.
            Most phones stay signed in, so you may not need to.
          </>,
          <>
            Can&apos;t get in? See{' '}
            <Link href='#forgot-password'>Forgot your password</Link>.
          </>,
        ],
      },
      {
        id: 'forgot-password',
        title: 'Forgot your password',
        icon: LockResetOutlined,
        intro: 'You can set a new one yourself from the sign-in page.',
        steps: [
          <>
            On the sign-in page, tap <Tap>Forgot your password?</Tap> under{' '}
            <Tap>Sign in</Tap>.
          </>,
          <>
            Type the email you signed up with and tap{' '}
            <Tap>Send reset link</Tap>.
          </>,
          <>
            Open the email from SLICs and tap the link in it. It works once,
            for 30 minutes.
          </>,
          <>
            Type a new password twice and tap <Tap>Change password</Tap>.
          </>,
          <>Sign in with your new password.</>,
        ],
        notes: [
          <>
            Signed up with Google? You don&apos;t have a SLICs password. Tap{' '}
            <Tap>Continue with Google</Tap> instead.
          </>,
          <>
            No email after a few minutes? Check your spam folder. Still
            nothing? Email{' '}
            <Link href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</Link> and
            the admin will send you a reset link.
          </>,
          <>
            Want a new password while you&apos;re signed in? On your profile,
            tap the gear, then <Tap>Change password</Tap>. It signs you out
            everywhere, so sign in again with the new one.
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
        screen: 'menu',
        title: 'Find your way around',
        icon: MenuOutlined,
        steps: [
          <>
            Tap the menu button (three lines) at the top left of the screen.
          </>,
          <>
            <Tap>Look up a SLIC</Tap> takes you to the search.{' '}
            <Tap>All Hubs</Tap> shows only UPS buildings. <Tap>Places</Tap>{' '}
            has fuel, food and restrooms other drivers have found.
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
        screen: 'search',
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
        screen: 'navigate',
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
        screen: 'call',
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
        screen: 'copy',
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
        screen: 'pdf',
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
        screen: 'tips',
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
        screen: 'post-tip',
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
        screen: 'report',
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
  {
    id: 'places',
    title: 'Places on your run',
    guides: [
      {
        id: 'find-place',
        title: 'Find fuel, food or a restroom',
        icon: SignpostOutlined,
        intro:
          'Whip it in and whip it out: stops other drivers have found, and whether a trailer fits.',
        steps: [
          <>
            Open the menu (three lines at the top left) and tap{' '}
            <Tap>Places</Tap>.
          </>,
          <>
            Tap <Tap>Near me</Tap> to put the closest places first. If your
            phone asks to share your location, allow it.
          </>,
          <>
            Tap a kind of place to narrow the list, like <Tap>Fuel</Tap>,{' '}
            <Tap>Restroom</Tap> or <Tap>Truck parking</Tap>. Tap it again to
            undo.
          </>,
          <>
            Headed to a building? Type its SLIC in{' '}
            <Tap>Coming from / going to</Tap> to see the spots drivers tagged
            on that run.
          </>,
          <>
            Each card says whether a trailer fits and when it&apos;s open. Tap{' '}
            <Tap>Google Maps</Tap> to go there.
          </>,
        ],
        notes: [
          <>
            Distances are a straight line, not the drive. Check the route
            before you count on one.
          </>,
          <>
            When a place has a parking pin, maps take you to where trucks pull
            in, not just the address.
          </>,
        ],
      },
      {
        id: 'add-place',
        title: 'Add a place',
        icon: AddLocationAltOutlined,
        intro: 'Know a stop where a trailer gets in and out? Add it for everyone.',
        steps: [
          <>
            On Places, tap <Tap>Add place</Tap>.
          </>,
          <>
            Type the <Tap>Name</Tap>, like &ldquo;Pilot #312&rdquo;, and tap
            everything that&apos;s there: <Tap>Fuel</Tap>, <Tap>Food</Tap>,{' '}
            <Tap>Restroom</Tap> and so on.
          </>,
          <>
            Under <Tap>Tractor-trailer access</Tap>, pick{' '}
            <Tap>Trailer fits</Tap>, <Tap>Tight for a trailer</Tap> or{' '}
            <Tap>No trailers</Tap>.
          </>,
          <>
            Type the street, city and state. Type the hours, or turn on{' '}
            <Tap>Open 24 hours</Tap>.
          </>,
          <>
            Standing where trucks park? Under <Tap>Parking pin</Tap>, tap{' '}
            <Tap>Use my current location</Tap>. A Google Maps link works too.
          </>,
          <>
            Add the SLICs it&apos;s on the way to under{' '}
            <Tap>On the way to/from (SLICs)</Tap>, then tap{' '}
            <Tap>Add place</Tap>.
          </>,
        ],
        notes: [
          <>
            A rest area with no street address? Leave <Tap>Street</Tap> blank
            and drop a parking pin instead.
          </>,
          <>
            To change a place you added, tap the pencil on its card. Once
            another driver has commented on it, only the admin can delete it.
          </>,
        ],
      },
      {
        id: 'place-comments',
        title: 'Comment on a place',
        icon: ForumOutlined,
        steps: [
          <>
            On a place&apos;s card, tap <Tap>Comments</Tap>. The number is how
            many there are.
          </>,
          <>
            Tell drivers how it went: where to park, which lanes, how clean.
            Tap <Tap>Post</Tap>.
          </>,
          <>
            Tap <Tap>Reply</Tap> under a comment to answer it, like &ldquo;lot
            was full tonight.&rdquo;
          </>,
          <>
            Comment helped? Tap the thumbs up. Wrong? Tap the thumbs down. Tap
            it again to take your vote back.
          </>,
          <>
            On your own comments, tap the pencil to change it, or the trash
            can to delete it.
          </>,
        ],
      },
    ],
  },
];
