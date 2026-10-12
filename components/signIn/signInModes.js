// The three forms on /sign-in, by `?mode=` (sign-in has none): the panel's
// heading and the tab title. Shared by SignInPanel.jsx (client) and
// app/sign-in/page.jsx's generateMetadata (server), so it's a plain module.
export const SIGN_IN_MODES = {
  signin: { heading: 'Sign in to SLICs', title: 'Sign in' },
  signup: { heading: 'Create your account', title: 'Create an account' },
  forgot: { heading: 'Reset your password', title: 'Reset your password' },
};

export function signInMode(value) {
  return Object.hasOwn(SIGN_IN_MODES, value) ? value : 'signin';
}

// Switching forms is a View Transition (lib/viewTransition.js; the motion is
// in app/globals.css under "Sign in, sign up, reset"). Each piece of a form
// has a name, so what the forms share (Email, Password, the blue button)
// glides to its new place, pieces only one form has fade in or out, and the
// heading and links cross-fade, while the panel itself grows or shrinks
// (utility/AnimatedHeight.jsx). A name may be on one element at a time.
export const vt = (name) => ({ viewTransitionName: `signin-${name}` });
