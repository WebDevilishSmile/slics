'use client';

import { useEffect, useMemo, useState } from 'react';
import { Box, Portal } from '@mui/material';
import { keyframes } from '@mui/material/styles';

// Confetti and balloons over the whole screen for the thank-you note
// (docs/BMC-SUPPORT.md stage 3). Each change of `burst` (a counter) plays it
// once; it never blocks a tap (pointer-events: none) and removes itself when
// done. The caller skips it under reduced motion.
//
// Confetti is a canvas with simple physics: two cannons in the bottom corners,
// then a lighter fall from the top. Balloons are DOM elements moved only by
// translate/rotate, so they stay on the compositor. Colors are the theme's,
// read from MUI's CSS variables so they follow light and dark.

const COLOR_VARS = [
  '--mui-palette-primary-main',
  '--mui-palette-primary-light',
  '--mui-palette-warning-main',
  '--mui-palette-success-main',
  '--mui-palette-error-light',
  '--mui-palette-info-light',
  '--mui-palette-bmc-main',
];
const FALLBACK_COLORS = ['#1565c0', '#64b5f6', '#ffb300', '#2e7d32', '#ef5350', '#4fc3f7', '#ffffff'];

const BALLOON_COLORS = ['primary-main', 'warning-main', 'error-light', 'success-main', 'primary-light', 'info-main', 'warning-light'];

const PLAY_MS = 9000;

function themeColors() {
  const style = getComputedStyle(document.documentElement);
  const colors = COLOR_VARS.map((name) => style.getPropertyValue(name).trim()).filter(Boolean);
  return colors.length >= 3 ? colors : FALLBACK_COLORS;
}

const rand = (min, max) => min + Math.random() * (max - min);

// → a stop function. Time-based, so it plays the same at 60 or 120 Hz.
function runConfetti(canvas) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const W = window.innerWidth;
  const H = window.innerHeight;
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  ctx.scale(dpr, dpr);

  const colors = themeColors();
  const small = W < 600;
  const g = 0.32 * (H / 800); // gravity, px per frame², scaled to the screen
  const terminal = 2.6 * (H / 800);
  const parts = [];

  const piece = (extra) => ({
    w: rand(6, 11),
    h: rand(9, 16),
    rot: rand(0, Math.PI * 2),
    vr: rand(-0.18, 0.18),
    tilt: rand(0, Math.PI * 2),
    vt: rand(0.06, 0.16),
    sway: rand(0.4, 1.1),
    circle: Math.random() < 0.22,
    color: colors[Math.floor(Math.random() * colors.length)],
    ...extra,
  });

  // The cannons: each piece aims for a height and a reach across the screen.
  const perCannon = small ? 60 : 90;
  for (const [x, dir] of [
    [-8, 1],
    [W + 8, -1],
  ]) {
    for (let i = 0; i < perCannon; i += 1) {
      const vy = -Math.sqrt(2 * g * H * rand(0.45, 0.92));
      const riseFrames = -vy / g;
      const vx = (dir * W * rand(0.15, 0.7) * 1.5) / riseFrames;
      parts.push(piece({ x, y: H + 10, vx, vy, delay: rand(0, 180) }));
    }
  }
  // A softer fall from the top once the cannons have peaked.
  for (let i = 0; i < (small ? 40 : 70); i += 1) {
    parts.push(piece({ x: rand(0, W), y: rand(-60, -10), vx: rand(-1, 1), vy: rand(0, 1.5), delay: rand(700, 1600) }));
  }

  let frame = 0;
  let start = null;
  let last = null;

  const tick = (now) => {
    if (start === null) {
      start = now;
      last = now;
    }
    const elapsed = now - start;
    const dt = Math.min((now - last) / 16.667, 3);
    last = now;

    ctx.clearRect(0, 0, W, H);
    let alive = 0;
    for (const p of parts) {
      if (elapsed < p.delay) {
        alive += 1;
        continue;
      }
      p.vy = p.vy + g * dt;
      if (p.vy > terminal) p.vy = terminal + (p.vy - terminal) * Math.pow(0.9, dt);
      p.vx *= Math.pow(0.985, dt);
      p.tilt += p.vt * dt;
      p.rot += p.vr * dt;
      p.x += (p.vx + Math.sin(p.tilt) * p.sway * (p.vy > 0 ? 1 : 0)) * dt;
      p.y += p.vy * dt;
      if (p.y > H + 30) continue;
      alive += 1;

      // Fade over the last 1.5 s so nothing pops out of existence.
      ctx.globalAlpha = Math.max(0, Math.min(1, (PLAY_MS - elapsed) / 1500));
      ctx.fillStyle = p.color;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.scale(1, Math.cos(p.tilt)); // the flip that makes paper flutter
      if (p.circle) {
        ctx.beginPath();
        ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      }
      ctx.restore();
    }

    if (alive > 0 && elapsed < PLAY_MS) frame = requestAnimationFrame(tick);
    else ctx.clearRect(0, 0, W, H);
  };
  frame = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(frame);
}

const rise = keyframes`
  from { translate: 0 0; }
  to { translate: var(--drift) calc(-100dvh - 100%); }
`;
const sway = keyframes`
  from { translate: -0.6rem 0; rotate: -6deg; }
  to { translate: 0.6rem 0; rotate: 6deg; }
`;

function Balloon({ color, left, size, delay, duration, drift, swayMs }) {
  return (
    <Box
      sx={{
        position: 'absolute',
        top: '100%',
        left,
        width: size,
        '--drift': drift,
        animation: `${rise} ${duration}ms cubic-bezier(0.35, 0, 0.65, 1) ${delay}ms both`,
      }}
    >
      <Box
        sx={{
          color: `var(--mui-palette-${color})`,
          transformOrigin: '50% 100%',
          animation: `${sway} ${swayMs}ms ease-in-out ${delay}ms infinite alternate both`,
        }}
      >
        <Box component='svg' viewBox='0 0 60 110' sx={{ display: 'block', width: 1, overflow: 'visible' }}>
          <path d='M30 2 C46 2 57 15 57 32 C57 52 42 68 30 72 C18 68 3 52 3 32 C3 15 14 2 30 2 Z' fill='currentColor' />
          <ellipse cx='20' cy='22' rx='6' ry='10' fill='#fff' fillOpacity='0.35' transform='rotate(-25 20 22)' />
          <path d='M26 77 L30 71 L34 77 Z' fill='currentColor' />
          <path d='M30 77 C25 86 35 94 29 108' fill='none' stroke='currentColor' strokeOpacity='0.6' strokeWidth='1.2' />
        </Box>
      </Box>
    </Box>
  );
}

export default function Celebration({ burst }) {
  // A callback ref: Portal mounts its children a render late, so the canvas
  // isn't there yet when `playing` turns on.
  const [canvas, setCanvas] = useState(null);
  const [playing, setPlaying] = useState(false);

  // New balloons for every burst.
  const balloons = useMemo(() => {
    if (!burst) return [];
    const count = typeof window !== 'undefined' && window.innerWidth < 600 ? 7 : 11;
    return Array.from({ length: count }, (_, i) => ({
      key: `${burst}-${i}`,
      color: BALLOON_COLORS[i % BALLOON_COLORS.length],
      left: `${((i + rand(0.1, 0.9)) / count) * 92}%`,
      size: `${rand(3.2, 5).toFixed(2)}rem`,
      delay: Math.round(rand(150, 1600)),
      duration: Math.round(rand(5200, 7600)),
      drift: `${rand(-4, 4).toFixed(1)}rem`,
      swayMs: Math.round(rand(1400, 2200)),
    }));
  }, [burst]);

  useEffect(() => {
    if (!burst) return undefined;
    setPlaying(true);
    const done = setTimeout(() => setPlaying(false), PLAY_MS + 500);
    return () => clearTimeout(done);
  }, [burst]);

  useEffect(() => {
    if (!canvas) return undefined;
    return runConfetti(canvas);
  }, [canvas]);

  if (!playing) return null;

  return (
    <Portal>
      <Box
        aria-hidden
        sx={{ position: 'fixed', inset: 0, zIndex: 'celebration', pointerEvents: 'none', overflow: 'hidden' }}
      >
        {balloons.map(({ key, ...balloon }) => (
          <Balloon key={key} {...balloon} />
        ))}
        <Box component='canvas' ref={setCanvas} sx={{ position: 'absolute', inset: 0, width: 1, height: 1 }} />
      </Box>
    </Portal>
  );
}
