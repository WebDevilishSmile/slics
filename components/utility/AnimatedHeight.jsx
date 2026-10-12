'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { Box } from '@mui/material';

// A box whose height follows its content smoothly instead of jumping: a
// ResizeObserver measures the content, and the box transitions to that height
// (250ms, --ease-out; the reduced-motion floor in app/globals.css makes it
// instant). The first measurement doesn't animate (from `auto`). It clips
// while it resizes, so it reaches 16px past its content on every side, with a
// matching negative margin, to keep soft shadows (theme.soft.raisedSmall
// reaches about 10px) and focus rings visible.
export default function AnimatedHeight({ children, sx }) {
  const contentRef = useRef(null);
  const [height, setHeight] = useState('auto');

  useLayoutEffect(() => {
    const content = contentRef.current;
    if (!content || typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(([entry]) => {
      const box = entry.borderBoxSize?.[0];
      setHeight(box ? box.blockSize : content.offsetHeight);
    });
    observer.observe(content);
    return () => observer.disconnect();
  }, []);

  return (
    <Box
      sx={[
        {
          // The content's height plus the 16px clip margin above and below.
          height: height === 'auto' ? 'auto' : `calc(${height}px + 2rem)`,
          m: -2,
          p: 2,
          overflow: 'hidden',
          transition: 'height 250ms var(--ease-out)',
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <div ref={contentRef}>{children}</div>
    </Box>
  );
}
