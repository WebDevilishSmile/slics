'use client';

import { Alert, Autocomplete, Box, Link, TextField } from '@mui/material';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import theme from '@/utils/theme';

function getDonationMessage(count) {
  if (count <= 0) return null;
  if (count <= 5) return `Enjoying SLICs? Help keep it free!`;
  if (count <= 20)
    return `You've looked up ${count} slics — consider supporting us!`;
  if (count <= 50)
    return `You're a power user! ${count} lookups and counting — your support helps keep SLICs free.`;
  return `${count} lookups! SLICs runs on community support — thank you for being here.`;
}

function SlicsSearch({ slics, setLoading, loading, viewCount, isMember }) {
  const donationMessage = isMember ? null : getDonationMessage(viewCount);
  const [selectedSlic, setSelectedSlic] = useState('');
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const slicLabels = slics.map((slic) => {
    if (slic.type === 'center' || !slic.type) {
      return `${slic.numSlic} - ${slic.alphaSlic}`;
    } else if (slic.type === 'customer') {
      return `${slic.numSlic} - ${slic.name} - ${slic.alphaSlic}`;
    }
    return '';
  });

  const handleSlicChange = (event, value) => {
    setLoading(true);
    startTransition(() => {
      setSelectedSlic(value || '');

      const slicNum = value ? value.split(' ')[0] : '';
      const newPath = slicNum ? `${pathname}?slic=${slicNum}` : pathname;

      router.push(newPath);
    });
  };

  useEffect(() => {
    setLoading(isPending);
  }, [searchParams, setLoading]);

  useEffect(() => {
    const initialSlic = searchParams.get('slic');
    if (initialSlic) {
      const slic = slics.find(
        (s) => s.numSlic === initialSlic || s.alphaSlic === initialSlic,
      );
      if (slic) {
        const label =
          slic.type === 'customer'
            ? `${slic.numSlic} - ${slic.name} - ${slic.alphaSlic}`
            : `${slic.numSlic} - ${slic.alphaSlic}`;
        setSelectedSlic(label);
      }
    } else {
      setSelectedSlic('');
    }
  }, [searchParams, slics]);

  return (
    <Box
      sx={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {donationMessage && (
        <Alert
          severity='info'
          sx={{
            width: '100%',
            maxWidth: theme.layout.maxWidth,
            mt: '1.5rem',
          }}
        >
          {donationMessage}{' '}
          <Link
            href='https://buymeacoffee.com/tiagodavila'
            target='_blank'
            rel='noopener noreferrer'
          >
            Buy Me a Coffee{' '}
          </Link>
          or{' '}
          <Link
            href='https://buymeacoffee.com/tiagodavila/membership'
            target='_blank'
            rel='noopener noreferrer'
          >
            Become a member
          </Link>
        </Alert>
      )}
      <Autocomplete
        fullWidth
        options={slicLabels}
        renderInput={(params) => <TextField {...params} label='Search Slics' />}
        sx={{
          width: '100%',
          maxWidth: theme.layout.maxWidth,
          mt: 3,
          px: 2,
        }}
        onChange={handleSlicChange}
        value={selectedSlic}
        isOptionEqualToValue={(option, value) =>
          option === value || value === ''
        }
        loading={loading}
      />
    </Box>
  );
}

export default SlicsSearch;
