'use client';

import { MAX_WIDTH } from '@/utils/variables';
import { Autocomplete, TextField } from '@mui/material';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

function SlicsSearch({ slics }) {
  const [selectedSlic, setSelectedSlic] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  const slicLabels = slics.map((slic) => {
    if (slic.type === 'center') {
      return `${slic.numSlic} - ${slic.alphaSlic}`;
    } else if (slic.type === 'customer') {
      return `${slic.numSlic} - ${slic.name}`;
    }
  });

  const handleSlicChange = (event, value) => {
    if (!value) {
      setSelectedSlic('');
      router.push(`/`);

      return;
    } else {
      setSelectedSlic(value);
      router.push(`/?slic=${value.split(' ').at(0)}`);
    }
  };

  useEffect(() => {
    const initialSlic = searchParams.get('slic');
    if (initialSlic) {
      const slic = slics.find(
        (s) => s.numSlic === initialSlic || s.alphaSlic === initialSlic
      );
      if (slic) {
        if (slic.type === 'center') {
          setSelectedSlic(`${slic.numSlic} - ${slic.alphaSlic}`);
        } else if (slic.type === 'customer') {
          setSelectedSlic(`${slic.numSlic} - ${slic.name}`);
        }
      }
    } else {
      setSelectedSlic('');
    }
  }, [searchParams, slics]);

  return (
    <Autocomplete
      fullWidth
      options={slicLabels}
      renderInput={(params) => <TextField {...params} label='Search Slics' />}
      sx={{
        width: '90%',
        maxWidth: `calc(${MAX_WIDTH} - 15%)`,
        mt: '1.5rem',
      }}
      onChange={handleSlicChange}
      value={selectedSlic}
    />
  );
}

export default SlicsSearch;
