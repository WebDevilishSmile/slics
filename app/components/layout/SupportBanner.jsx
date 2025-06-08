'use client';

import theme from '@/utils/theme';
import { ELEVATION } from '@/utils/variables';
// src/components/SupportBanner.jsx (or wherever your component is located)

import { Box, Paper, Typography, useScrollTrigger } from '@mui/material';
import { keyframes, styled } from '@mui/material/styles'; // For creating styled components

// 1. Define the Keyframe Animation for horizontal scrolling
const scrollText = keyframes`
  0% {
    transform: translateX(100%); /* Start off-screen to the right */
  }
  100% {
    transform: translateX(-100%); /* Move off-screen to the left */
  }
`;

// 2. Create a Styled Typography Component with the Animation
const AnimatedTypography = styled(Typography)(({ theme }) => ({
  whiteSpace: 'nowrap', // Prevent text from wrapping
  display: 'inline-block', // Important for the content width to be dynamic
  animation: `${scrollText} 30s linear infinite`, // Apply animation: 30s duration, linear speed, infinite loop
  fontSize: '1rem', // Adjust font size as needed
  paddingLeft: '100%', // Ensures the text starts fully off-screen right
}));

function SupportBanner() {
  const scrollTrigger = useScrollTrigger({
    disableHysteresis: true, // Disable hysteresis to trigger immediately
    threshold: 0, // Trigger at the top of the page
  });

  return (
    <Paper
      elevation={scrollTrigger ? ELEVATION : 0}
      sx={{
        position: 'fixed',
        top: '3.5rem',
        height: '2.4rem',
        left: 0,
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        padding: '0.5rem 0',
        textAlign: 'center',
        overflow: 'hidden',
        zIndex: 1000,
      }}
    >
      <AnimatedTypography>
        SLICs is brought to you by Tiago Davila. There are currently 14
        supporters.
      </AnimatedTypography>
    </Paper>
  );
}

export default SupportBanner;
