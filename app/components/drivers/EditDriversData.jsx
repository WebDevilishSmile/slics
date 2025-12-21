'use client'; // Required for useEffect and console logs in Next.js
import { useEffect } from 'react';
import { allDrivers } from '@/utils/random';

function EditDriversData() {
  useEffect(() => {
    const cleanDataForDB = (data) => {
      const results = data.map((driver) => {
        // 1. Remove any "??", extra spaces, or weird symbols
        let rawDate = driver.seniorityDate.replace(/\?+/g, '').trim();

        // 2. Separate the Date and the Suffix
        let [datePart, suffix] = rawDate.split('-').map((p) => p.trim());
        if (!suffix) suffix = 'A';

        // 3. Break down the date (Month/Day/Year)
        const dateBits = datePart.split('/');
        if (dateBits.length !== 3) return driver;

        let [m, d, y] = dateBits;

        // 4. Fix 2-digit years
        if (y.length === 2) y = `20${y}`;

        // 5. Zero-pad Month and Day
        const mm = m.padStart(2, '0');
        const dd = d.padStart(2, '0');

        return {
          ...driver,
          seniorityDate: `${y}-${mm}-${dd}-${suffix}`,
          name: driver.name.trim(),
          phone: driver.phone.replace(/[^\d-]/g, ''),
        };
      });

      return results;
    };

    const finalJson = cleanDataForDB(allDrivers);

    // This outputs the exact string you need to copy for MongoDB
    console.log('--- START OF CLEAN JSON ---');
    console.log(JSON.stringify(finalJson));
    console.log('--- END OF CLEAN JSON ---');

    alert('Check your browser console (F12) for the clean JSON!');
  }, []);

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Data Cleaner Active</h1>
      <p>Open your Developer Console (F12) to get the JSON string.</p>
    </div>
  );
}

export default EditDriversData;
