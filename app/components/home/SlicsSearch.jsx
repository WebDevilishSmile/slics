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
  });

  const handleSlicChange = async (event, value) => {
    setLoading(true);
    if (pathname === '/home') {
      if (!value) {
        setSelectedSlic('');
        router.push(`/home`);
        setLoading(false);

        return;
      } else {
        setSelectedSlic(value);
        router.push(`/home?slic=${value.split(' ').at(0)}`);
        setLoading(false);
      }
    } else if (pathname.startsWith('/all')) {
      if (!value) {
        setSelectedSlic('');
        router.push(`/all`);
        setLoading(false);

        return;
      } else {
        setSelectedSlic(value);
        router.push(`/all?slic=${value.split(' ').at(0)}`);
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    setLoading(true);
    const initialSlic = searchParams.get('slic');
    if (initialSlic) {
      const slic = slics.find(
        (s) => s.numSlic === initialSlic || s.alphaSlic === initialSlic
      );
      if (slic) {
        if (slic.type === 'center' || !slic.type) {
          setSelectedSlic(`${slic.numSlic} - ${slic.alphaSlic}`);
          setLoading(false);
        } else if (slic.type === 'customer') {
          setSelectedSlic(`${slic.numSlic} - ${slic.name}`);
          setLoading(false);
        }
      }
    } else {
      setSelectedSlic('');
      setLoading(false);
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
