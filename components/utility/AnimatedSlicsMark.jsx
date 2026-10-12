import { SvgIcon } from '@mui/material';

// The SLICs mark drawing itself: its destination dot starts in the middle,
// draws a question mark, erases it, then draws the S and lands where the
// logo's dot sits. By default it plays once and stays on the logo (the 404
// page); with `loop` it then erases the S, slides back to the middle and
// starts over (the top of /help). For the places a question turns into SLICs,
// never the daily lookup path. The glyphs are the ones in
// public/slics-question-icon.svg and public/slics-icon.svg (SlicsMark.jsx);
// public/slics-animated-logo.svg is the looping version as a file, for use
// outside the app.
//
// SVG animation (SMIL): one timeline, no JavaScript. The dot rides a single
// motion path, and each glyph's stroke is revealed and erased by its dash
// offset on the same keyTimes and keySplines, so the stroke's tip stays under
// the dot. It plays from page load, or from mount after a client-side
// navigation. The dot's group sits in the middle and its path is relative to
// it, so until the timeline starts the mark shows its first frame. The
// reduced-motion floor in app/globals.css only stills CSS animations, so this
// swaps itself for the still mark.

const MIDDLE = [50, 50];
const DOT_R = 6.4;
const STROKE_WIDTH = 9.5;

const fmt = (n) => +n.toFixed(4);
const relative = ([x, y]) => `${fmt(x - MIDDLE[0])} ${fmt(y - MIDDLE[1])}`;
const distance = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);

function arcLength(from, { r, large, to }) {
  const chord = distance(from, to);
  const radius = Math.max(r, chord / 2);
  const angle = 2 * Math.asin(Math.min(1, chord / (2 * radius)));
  return radius * (large ? 2 * Math.PI - angle : angle);
}

// A glyph: where its stroke starts, its arcs, and where its dot sits.
function glyph({ start, arcs, dot }) {
  const points = [start, ...arcs.map((a) => a.to)];
  return {
    start,
    end: points.at(-1),
    dot,
    d: `M${start.join(' ')}${arcs.map((a) => `A${a.r} ${a.r} 0 ${a.large} ${a.sweep} ${a.to.join(' ')}`).join('')}`,
    length: arcs.reduce((sum, a, i) => sum + arcLength(points[i], a), 0),
    // The same arcs for the dot's motion path, forward and backward.
    forward: arcs.map((a) => `A${a.r} ${a.r} 0 ${a.large} ${a.sweep} ${relative(a.to)}`).join(''),
    backward: arcs
      .map((a, i) => `A${a.r} ${a.r} 0 ${a.large} ${1 - a.sweep} ${relative(points[i])}`)
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

// keySplines (cubic Béziers, control points inside 0..1).
const HOLD = '0 0 1 1';
const SLIDE = '0.65 0 0.35 1';
const DRAW = '0.45 0 0.4 1';
const HOP = '0.33 0 0.2 1';

// Seconds, easing, and where the dot goes: a straight line `to` a point, or
// along a glyph to `draw` or `erase` it. No destination is a pause.
const ONCE = [
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
const LOOP = [
  ...ONCE,
  { dur: 1.2, ease: HOLD },
  { dur: 0.25, ease: HOP, to: S.end },
  { dur: 1.1, ease: DRAW, erase: S },
  { dur: 0.5, ease: SLIDE, to: MIDDLE },
];

// Everything the SVG needs for one run of `legs`: the dot's motion path and
// keyPoints, the shared keyTimes and keySplines, and each glyph's stroke keys.
function timeline(legs, loop) {
  let at = MIDDLE;
  let path = 'M0 0';
  const times = [0];
  const distances = [0];
  for (const leg of legs) {
    let length = 0;
    if (leg.to) {
      path += `L${relative(leg.to)}`;
      length = distance(at, leg.to);
      at = leg.to;
    } else if (leg.draw) {
      path += leg.draw.forward;
      length = leg.draw.length;
      at = leg.draw.end;
    } else if (leg.erase) {
      path += leg.erase.backward;
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
    let offset = g.length;
    let shown = 0;
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

  return {
    timing: {
      dur: `${fmt(times.at(-1))}s`,
      keyTimes: times.map((t) => fmt(t / times.at(-1))).join(';'),
      ...(loop ? { repeatCount: 'indefinite' } : { fill: 'freeze' }),
    },
    keySplines: legs.map((leg) => leg.ease).join(';'),
    keyPoints: distances.map((d) => fmt(d / distances.at(-1))).join(';'),
    path,
    strokes: [QUESTION, S].map((g) => ({ ...g, keys: strokeKeys(g) })),
  };
}

const TIMELINES = { once: timeline(ONCE, false), loop: timeline(LOOP, true) };

export default function AnimatedSlicsMark({ loop = false, sx, ...props }) {
  const { timing, keySplines, keyPoints, path, strokes } = TIMELINES[loop ? 'loop' : 'once'];
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
      <g className='still'>
        <path
          d={S.d}
          fill='none'
          stroke='currentColor'
          strokeWidth={STROKE_WIDTH}
          strokeLinecap='round'
        />
        <circle cx={S.dot[0]} cy={S.dot[1]} r={DOT_R} />
      </g>

      <g
        className='animated'
        fill='none'
        stroke='currentColor'
        strokeWidth={STROKE_WIDTH}
        strokeLinecap='round'
      >
        {strokes.map((g) => (
          <path
            key={g.d}
            d={g.d}
            strokeDasharray={`${fmt(g.length)} ${fmt(g.length)}`}
            strokeDashoffset={fmt(g.length)}
            opacity={0}
          >
            <animate
              attributeName='stroke-dashoffset'
              values={g.keys.offsets}
              calcMode='spline'
              keySplines={keySplines}
              {...timing}
            />
            <animate
              attributeName='opacity'
              values={g.keys.opacity}
              calcMode='discrete'
              {...timing}
            />
          </path>
        ))}
        <g transform={`translate(${MIDDLE.join(' ')})`}>
          <circle r={DOT_R} fill='currentColor' stroke='none'>
            <animateMotion
              path={path}
              keyPoints={keyPoints}
              calcMode='spline'
              keySplines={keySplines}
              {...timing}
            />
          </circle>
        </g>
      </g>
    </SvgIcon>
  );
}
