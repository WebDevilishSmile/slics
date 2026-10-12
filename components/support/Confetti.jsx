'use client';

import { useEffect, useRef } from 'react';
import { Box } from '@mui/material';

// The thank-you note's confetti (docs/BMC-SUPPORT.md stage 3): one burst from
// behind the letter as it comes out of the envelope. The note renders it just
// before the letter, inside the dialog, so it flies over the backdrop but
// never over the words, and it goes when the note closes. It plays once on
// mount, never takes a tap and clears itself when done. The note skips it
// under reduced motion.
//
// A canvas with simple, time-based physics (the same at 60 or 120 Hz). Colors
// are the theme's, read from MUI's CSS variables so they follow light and
// dark. `from` is a ref to the letter: the burst starts behind its top half.

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

const PLAY_MS = 4500;
const FADE_MS = 1200;

function themeColors() {
  const style = getComputedStyle(document.documentElement);
  const colors = COLOR_VARS.map((name) => style.getPropertyValue(name).trim()).filter(Boolean);
  return colors.length >= 3 ? colors : FALLBACK_COLORS;
}

const rand = (min, max) => min + Math.random() * (max - min);

// → a stop function.
function burst(canvas, origin) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const W = window.innerWidth;
  const H = window.innerHeight;
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  ctx.scale(dpr, dpr);

  const colors = themeColors();
  const g = 0.3 * (H / 800); // gravity, px per frame², scaled to the screen
  // Falling fast enough to come out from under the letter before the end.
  const terminal = 4.2 * (H / 800);

  // Each piece aims for a height between a third of the way and all the way
  // to the top, and a reach across the screen, so the burst fills the space
  // around the letter rather than a column above it.
  const parts = Array.from({ length: W < 600 ? 110 : 160 }, () => {
    const vy = -Math.sqrt(2 * g * origin.y * rand(0.35, 1.05));
    const riseFrames = -vy / g;
    return {
      x: origin.x + rand(-1, 1) * origin.spread,
      y: origin.y,
      vx: (rand(-1, 1) * W * 0.55) / riseFrames,
      vy,
      delay: rand(0, 140),
      w: rand(6, 11),
      h: rand(9, 16),
      rot: rand(0, Math.PI * 2),
      vr: rand(-0.18, 0.18),
      tilt: rand(0, Math.PI * 2),
      vt: rand(0.06, 0.16),
      sway: rand(0.4, 1.1),
      circle: Math.random() < 0.22,
      color: colors[Math.floor(Math.random() * colors.length)],
    };
  });

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
    // Fade over the end so nothing pops out of existence.
    ctx.globalAlpha = Math.max(0, Math.min(1, (PLAY_MS - elapsed) / FADE_MS));
    let alive = 0;
    for (const p of parts) {
      if (elapsed < p.delay) {
        alive += 1;
        continue;
      }
      p.vy += g * dt;
      if (p.vy > terminal) p.vy = terminal + (p.vy - terminal) * Math.pow(0.9, dt);
      p.vx *= Math.pow(0.985, dt);
      p.tilt += p.vt * dt;
      p.rot += p.vr * dt;
      p.x += (p.vx + Math.sin(p.tilt) * p.sway * (p.vy > 0 ? 1 : 0)) * dt;
      p.y += p.vy * dt;
      if (p.y > H + 30) continue;
      alive += 1;

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

export default function Confetti({ from }) {
  const canvas = useRef(null);

  useEffect(() => {
    if (!canvas.current) return undefined;
    const box = from.current?.getBoundingClientRect();
    const origin = box
      ? { x: box.left + box.width / 2, y: box.top + Math.min(box.height / 4, 120), spread: box.width * 0.3 }
      : { x: window.innerWidth / 2, y: window.innerHeight / 3, spread: 60 };
    return burst(canvas.current, origin);
  }, [from]);

  return (
    <Box
      component='canvas'
      ref={canvas}
      aria-hidden
      sx={{ position: 'fixed', inset: 0, width: 1, height: 1, pointerEvents: 'none' }}
    />
  );
}
