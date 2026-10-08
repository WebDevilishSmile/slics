'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useColorScheme } from '@mui/material';

import { statusBarColors } from '@/theme';

// Keeps the browser/status bar on the header's color (UI-SUGGESTIONS.md #35).
// app/layout.jsx renders one <meta name="theme-color"> per OS color scheme,
// which is right until a driver pins a mode with the menu's Dark mode switch:
// the OS-matched meta would then paint the other scheme's color. So once React
// knows the scheme on screen, every theme-color meta gets that scheme's color.
// The pathname dependency re-applies it if a navigation re-renders <head>.
function ThemeColorSync() {
  const { colorScheme } = useColorScheme();
  const pathname = usePathname();

  useEffect(() => {
    if (!colorScheme) return;
    for (const meta of document.querySelectorAll('meta[name="theme-color"]')) {
      meta.setAttribute('content', statusBarColors[colorScheme]);
    }
  }, [colorScheme, pathname]);

  return null;
}

export default ThemeColorSync;
