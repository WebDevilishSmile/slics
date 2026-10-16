import { SvgIcon } from '@mui/material';

// The SLICs mark drawing itself, as one of three stories:
// - `question` (the default): its destination dot starts in the middle, draws
//   a question mark, erases it, then draws the S and lands where the logo's
//   dot sits. It plays once and stays on the logo (the 404 page); with `loop`
//   it then erases the S, slides back to the middle and starts over (the top
//   of /help).
// - `heart`: it starts as a heart, which beats twice; then the dot comes out
//   of the heart's line, erases it and draws the S. It plays once, after
//   Tiago signs the thank-you note (support/ThankYouNote.jsx), and stays on
//   the logo.
// - `dot`: the logo's dot alone, in the middle. It takes a breath, then goes
//   to the top of the S, draws it and lands where the logo's dot sits. It
//   plays once, after Tiago signs the welcome note a new admin or dispatcher
//   gets (staff/WelcomeNote.jsx), and stays on the logo.
// For the places a question, a thank-you or a welcome turns into SLICs, never
// the daily lookup path. The glyphs are the ones in
// public/slics-question-icon.svg, public/slics-icon.svg (SlicsMark.jsx) and
// public/slics-heart-icon.svg; public/slics-animated-logo.svg,
// public/slics-animated-heart-logo.svg and public/slics-animated-dot-logo.svg
// are the looping versions as files, for use outside the app.
//
// SVG animation (SMIL): one timeline, no JavaScript. The dot rides a single
// motion path, and each glyph's stroke is revealed and erased by its dash
// offset on the same keyTimes and keySplines, so the stroke's tip stays under
// the dot. It plays from page load, or from mount after a client-side
// navigation. The dot's group sits where the story starts and its path is
// relative to it, so until the timeline starts the mark shows its first
// frame; `paused` shows only that frame, with nothing to play. The
// reduced-motion floor in app/globals.css only stills CSS animations, so this
// swaps itself for the still mark, the story's last frame.

const MIDDLE = [50, 50];
const DOT_R = 6.4;
const STROKE_WIDTH = 9.5;
// Every glyph's line.
const STROKE = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: STROKE_WIDTH,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

const fmt = (n) => +n.toFixed(4);
const relative = ([x, y], [ox, oy]) => `${fmt(x - ox)} ${fmt(y - oy)}`;
const distance = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);

function arcLength(from, { r, large, to }) {
  const chord = distance(from, to);
  const radius = Math.max(r, chord / 2);
  const angle = 2 * Math.asin(Math.min(1, chord / (2 * radius)));
  return radius * (large ? 2 * Math.PI - angle : angle);
}

// A glyph: where its stroke starts, its arcs, and where its dot sits.
function glyph({ start, arcs, dot = null }) {
  const points = [start, ...arcs.map((a) => a.to)];
  return {
    start,
    end: points.at(-1),
    dot,
    d: `M${start.join(' ')}${arcs.map((a) => `A${a.r} ${a.r} 0 ${a.large} ${a.sweep} ${a.to.join(' ')}`).join('')}`,
    length: arcs.reduce((sum, a, i) => sum + arcLength(points[i], a), 0),
    // The same arcs for the dot's motion path, relative to where the dot's
    // group sits, forward and backward.
    forward: (origin) =>
      arcs.map((a) => `A${a.r} ${a.r} 0 ${a.large} ${a.sweep} ${relative(a.to, origin)}`).join(''),
    backward: (origin) =>
      arcs
        .map((a, i) => `A${a.r} ${a.r} 0 ${a.large} ${1 - a.sweep} ${relative(points[i], origin)}`)
        .reverse()
        .join(''),
  };
}

const QUESTION = glyph({
  start: [38.74, 28.25],
  arcs: [
    { r: 13, large: 1, sweep: 1, to: [56.5, 46.01] },
    { r: 13, large: 0, sweep: 0, to: [50, 57.27] },
  ],
  dot: [50, 73.6],
});
const S = glyph({
  start: [60.09, 25.92],
  arcs: [
    { r: 12.8, large: 1, sweep: 0, to: [50, 46.6] },
    { r: 14, large: 1, sweep: 1, to: [49.51, 74.59] },
  ],
  dot: [37.64, 67.17],
});
// Drawn the way a hand draws one, from the cleft round and back to it: an
// r12.5 lobe that leaves the cleft at 38° from upright, a gentle r78.58 side
// that meets the tip at 50°, and the same again up the other side, each arc
// tangent to the next. Its middle is the S's, so it sits where the logo sits.
// It has no dot of its own: the dot waits inside the line where it closes,
// shrunk to the stroke's width, so it's the line's round end.
const HEART = glyph({
  start: [50, 30],
  arcs: [
    { r: 12.5, large: 0, sweep: 0, to: [28.73, 42.78] },
    { r: 78.58, large: 0, sweep: 0, to: [50, 71] },
    { r: 78.58, large: 0, sweep: 0, to: [71.27, 42.78] },
    { r: 12.5, large: 0, sweep: 0, to: [50, 30] },
  ],
});

// keySplines (cubic Béziers, control points inside 0..1).
const HOLD = '0 0 1 1';
const SLIDE = '0.65 0 0.35 1';
const DRAW = '0.45 0 0.4 1';
const HOP = '0.33 0 0.2 1';

// Seconds, easing, and where the dot goes: a straight line `to` a point, or
// along a glyph to `draw` or `erase` it. No destination is a pause. A leg can
// also set the dot's radius (`r`) or the whole mark's `scale`, which hold
// until a later leg sets them again.
const QUESTION_ONCE = [
  { dur: 0.4, ease: HOLD },
  { dur: 0.5, ease: SLIDE, to: QUESTION.start },
  { dur: 1, ease: DRAW, draw: QUESTION },
  { dur: 0.25, ease: HOP, to: QUESTION.dot },
  { dur: 0.8, ease: HOLD },
  { dur: 0.25, ease: HOP, to: QUESTION.end },
  { dur: 0.8, ease: DRAW, erase: QUESTION },
  { dur: 0.5, ease: SLIDE, to: S.start },
  { dur: 1.4, ease: DRAW, draw: S },
  { dur: 0.25, ease: HOP, to: S.dot },
];
// The loop goes on from the logo back to where it started.
const QUESTION_LOOP = [
  ...QUESTION_ONCE,
  { dur: 1.2, ease: HOLD },
  { dur: 0.25, ease: HOP, to: S.end },
  { dur: 1.1, ease: DRAW, erase: S },
  { dur: 0.5, ease: SLIDE, to: MIDDLE },
];

// The heart holds while the letter comes forward and Tiago signs it (600ms
// in, for 1s; support/ThankYouNote.jsx), then beats: a big beat, then a
// smaller one. The dot grows back out of the line, erases the heart and draws
// the S, landing where the logo's dot sits.
const HEART_ONCE = [
  { dur: 1.7, ease: HOLD },
  { dur: 0.14, ease: HOP, scale: 1.14 },
  { dur: 0.16, ease: SLIDE, scale: 1 },
  { dur: 0.12, ease: HOP, scale: 1.08 },
  { dur: 0.3, ease: SLIDE, scale: 1 },
  { dur: 0.3, ease: HOLD },
  { dur: 0.2, ease: HOP, r: DOT_R },
  { dur: 1.3, ease: DRAW, erase: HEART },
  { dur: 0.45, ease: SLIDE, to: S.start },
  { dur: 1.4, ease: DRAW, draw: S },
  { dur: 0.25, ease: HOP, to: S.dot },
];
// The loop goes on from the logo back to the heart: it erases the S, draws
// the heart and settles back into its line.
const HEART_LOOP = [
  ...HEART_ONCE,
  { dur: 1.2, ease: HOLD },
  { dur: 0.25, ease: HOP, to: S.end },
  { dur: 1.1, ease: DRAW, erase: S },
  { dur: 0.45, ease: SLIDE, to: HEART.start },
  { dur: 1.8, ease: DRAW, draw: HEART },
  { dur: 0.2, ease: SLIDE, r: STROKE_WIDTH / 2 },
];

// The dot holds while the letter comes forward and Tiago signs it, like the
// heart (staff/WelcomeNote.jsx), then takes a breath: it swells and settles.
// It slides to the top of the S, draws it and lands where the logo's dot sits.
const DOT_ONCE = [
  { dur: 1.7, ease: HOLD },
  { dur: 0.18, ease: HOP, r: DOT_R * 1.3 },
  { dur: 0.24, ease: SLIDE, r: DOT_R },
  { dur: 0.2, ease: HOLD },
  { dur: 0.5, ease: SLIDE, to: S.start },
  { dur: 1.4, ease: DRAW, draw: S },
  { dur: 0.25, ease: HOP, to: S.dot },
];
// The loop goes on from the logo back to the dot alone: it erases the S and
// slides back to the middle.
const DOT_LOOP = [
  ...DOT_ONCE,
  { dur: 1.2, ease: HOLD },
  { dur: 0.25, ease: HOP, to: S.end },
  { dur: 1.1, ease: DRAW, erase: S },
  { dur: 0.5, ease: SLIDE, to: MIDDLE },
];

// Where each story starts (the dot and its radius, and any glyph already
// drawn), the glyphs it draws, its last frame (`still`, for reduced motion)
// and the point it scales about.
const STORIES = {
  question: {
    start: MIDDLE,
    startR: DOT_R,
    drawn: [],
    glyphs: [QUESTION, S],
    still: S,
    once: QUESTION_ONCE,
    loop: QUESTION_LOOP,
  },
  heart: {
    start: HEART.start,
    startR: STROKE_WIDTH / 2,
    drawn: [HEART],
    glyphs: [HEART, S],
    still: S,
    pivot: [50, 48],
    once: HEART_ONCE,
    loop: HEART_LOOP,
  },
  dot: {
    start: MIDDLE,
    startR: DOT_R,
    drawn: [],
    glyphs: [S],
    still: S,
    once: DOT_ONCE,
    loop: DOT_LOOP,
  },
};

// Everything the SVG needs for one run of `legs`: the dot's motion path and
// keyPoints, the shared keyTimes and keySplines, each glyph's stroke keys,
// and the dot's radius and the mark's scale where the story changes them.
function timeline({ start, startR, drawn, glyphs, pivot }, legs, loop) {
  let at = start;
  let path = 'M0 0';
  const times = [0];
  const distances = [0];
  for (const leg of legs) {
    let length = 0;
    if (leg.to) {
      path += `L${relative(leg.to, start)}`;
      length = distance(at, leg.to);
      at = leg.to;
    } else if (leg.draw) {
      path += leg.draw.forward(start);
      length = leg.draw.length;
      at = leg.draw.end;
    } else if (leg.erase) {
      path += leg.erase.backward(start);
      length = leg.erase.length;
      at = leg.erase.start;
    }
    times.push(times.at(-1) + leg.dur);
    distances.push(distances.at(-1) + length);
  }

  // A glyph's stroke at each leg boundary: its dash offset (its whole length
  // while hidden, 0 once drawn) and its opacity. It shows only from the start
  // of its draw to the end of its erase, so a zero-length dash's round cap
  // never shows where the dot isn't.
  const strokeKeys = (g) => {
    let offset = drawn.includes(g) ? 0 : g.length;
    let shown = drawn.includes(g) ? 1 : 0;
    const offsets = [offset];
    const opacity = [];
    for (const leg of legs) {
      if (leg.draw === g) shown = 1;
      opacity.push(shown);
      if (leg.draw === g) offset = 0;
      if (leg.erase === g) {
        offset = g.length;
        shown = 0;
      }
      offsets.push(offset);
    }
    opacity.push(shown);
    return { offsets: offsets.map(fmt).join(';'), opacity: opacity.join(';') };
  };

  // A value legs set (the dot's `r`, the mark's `scale`) at each leg
  // boundary, or null when no leg changes it.
  const heldKeys = (key, initial) => {
    if (!legs.some((leg) => key in leg)) return null;
    let value = initial;
    return [initial, ...legs.map((leg) => (value = leg[key] ?? value))].map(fmt).join(';');
  };

  return {
    timing: {
      dur: `${fmt(times.at(-1))}s`,
      keyTimes: times.map((t) => fmt(t / times.at(-1))).join(';'),
      ...(loop ? { repeatCount: 'indefinite' } : { fill: 'freeze' }),
    },
    keySplines: legs.map((leg) => leg.ease).join(';'),
    keyPoints: distances.map((d) => fmt(d / distances.at(-1))).join(';'),
    path,
    strokes: glyphs.map((g) => ({ ...g, shown: drawn.includes(g), keys: strokeKeys(g) })),
    radii: heldKeys('r', startR),
    scales: heldKeys('scale', 1),
    pivot,
  };
}

const TIMELINES = Object.fromEntries(
  Object.entries(STORIES).map(([name, story]) => [
    name,
    { once: timeline(story, story.once, false), loop: timeline(story, story.loop, true) },
  ]),
);

export default function AnimatedSlicsMark({
  story = 'question',
  loop = false,
  paused = false,
  sx,
  ...props
}) {
  const { start, startR, drawn, still } = STORIES[story];
  const { timing, keySplines, keyPoints, path, strokes, radii, scales, pivot } =
    TIMELINES[story][loop ? 'loop' : 'once'];
  const spline = { calcMode: 'spline', keySplines, ...timing };

  const marks = (
    <>
      {strokes.map((g) => (
        <path
          key={g.d}
          d={g.d}
          strokeDasharray={`${fmt(g.length)} ${fmt(g.length)}`}
          strokeDashoffset={g.shown ? 0 : fmt(g.length)}
          opacity={g.shown ? 1 : 0}
        >
          <animate attributeName='stroke-dashoffset' values={g.keys.offsets} {...spline} />
          <animate
            attributeName='opacity'
            values={g.keys.opacity}
            calcMode='discrete'
            {...timing}
          />
        </path>
      ))}
      <g transform={`translate(${start.join(' ')})`}>
        <circle r={startR} fill='currentColor' stroke='none'>
          <animateMotion path={path} keyPoints={keyPoints} {...spline} />
          {radii && <animate attributeName='r' values={radii} {...spline} />}
        </circle>
      </g>
    </>
  );

  return (
    <SvgIcon
      viewBox='17 15 66 66'
      color='primary'
      sx={[
        {
          display: 'block',
          '& .still': { display: 'none' },
          '@media (prefers-reduced-motion: reduce)': {
            '& .still': { display: 'inline' },
            '& .animated': { display: 'none' },
          },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      aria-hidden
      {...props}
    >
      {paused ? (
        // The first frame alone: what's drawn, and the dot where it waits.
        <g {...STROKE}>
          {drawn.map((g) => (
            <path key={g.d} d={g.d} />
          ))}
          <circle cx={start[0]} cy={start[1]} r={startR} fill='currentColor' stroke='none' />
        </g>
      ) : (
        <>
          <g className='still'>
            <path d={still.d} {...STROKE} />
            {still.dot && <circle cx={still.dot[0]} cy={still.dot[1]} r={DOT_R} />}
          </g>

          <g className='animated' {...STROKE}>
            {scales ? (
              // The beat scales the whole mark about `pivot`.
              <g transform={`translate(${pivot.join(' ')})`}>
                <g>
                  <animateTransform
                    attributeName='transform'
                    type='scale'
                    values={scales}
                    {...spline}
                  />
                  <g transform={`translate(${pivot.map((n) => -n).join(' ')})`}>{marks}</g>
                </g>
              </g>
            ) : (
              marks
            )}
          </g>
        </>
      )}
    </SvgIcon>
  );
}
