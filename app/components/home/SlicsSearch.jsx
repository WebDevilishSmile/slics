'use client';

import { MAX_WIDTH } from '@/utils/variables';
import { Autocomplete, TextField } from '@mui/material';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

function SlicsSearch({ slics, setLoading }) {
  const [selectedSlic, setSelectedSlic] = useState('');
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const slicLabels = slics.map((slic) => {
    if (slic.type === 'center' || !slic.type) {
      return `${slic.numSlic} - ${slic.alphaSlic}`;
    } else if (slic.type === 'customer') {
      return `${slic.numSlic} - ${slic.name}`;
    }
    return '';
  });

  const handleSlicChange = async (event, value) => {
    setLoading(true); // Always set loading to true when navigation starts
    let newPath = '';
    let slicNum = value ? value.split(' ').at(0) : '';

    if (pathname === '/home') {
      newPath = `/home${slicNum ? `?slic=${slicNum}` : ''}`;
    } else if (pathname.startsWith('/all')) {
      newPath = `/all${slicNum ? `?slic=${slicNum}` : ''}`;
    }

    setSelectedSlic(value || ''); // Update local state for Autocomplete

    router.push(newPath);
  };

  useEffect(() => {
    const initialSlic = searchParams.get('slic');
    if (initialSlic) {
      const slic = slics.find(
        (s) => s.numSlic === initialSlic || s.alphaSlic === initialSlic
      );
      if (slic) {
        if (slic.type === 'center' || !slic.type) {
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
      isOptionEqualToValue={(option, value) => option === value || value === ''}
    />
  );
}

export default SlicsSearch;
