'use client';

import { useState, useEffect } from 'react';

export const useAppleDevice = () => {
  const [isAppleDevice, setIsAppleDevice] = useState(false);

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    const applePlatforms = /(iphone|ipad|ipod|mac)/g;
    setIsAppleDevice(applePlatforms.test(userAgent));
  }, []);

  return isAppleDevice;
};
