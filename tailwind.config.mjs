/** @type {import('tailwindcss').Config} */
export default {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}"],
  // No color extension on purpose: colors come from the MUI theme in
  // utils/theme.js (read them as var(--mui-palette-*) if you need one in CSS).
  theme: {
    extend: {},
  },
  plugins: [],
};
