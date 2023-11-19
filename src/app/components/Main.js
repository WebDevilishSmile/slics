'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

import { Box } from '@mui/material';

import Heading from './Heading';
import SelectDest from './SelectDest';
import UPSCenterInfo from './UPSCenterInfo';
import CustomerInfo from './CustomerInfo';
import DestInfo from './DestInfo';

export default function Main({ customers, centers, comments, session, user }) {
  const [slic, setSlic] = useState('');
  const [customer, setCustomer] = useState({});
  const [upsCenter, setUpsCenter] = useState({});
  const [checked, setChecked] = useState(true);

  function init() {
    setSlic('');
    setCustomer({});
    setUpsCenter({});
  }

  useEffect(() => {
    const selectedCustomer = customers.find((cus) => {
      if (slic === '') {
        return {};
      } else {
        return cus.numSlic === slic;
      }
    });
    setCustomer(selectedCustomer);
    const selectedCenter = centers.find((center) => {
      if (slic === '') {
        return {};
      } else {
        return center.numSlic === slic;
      }
    });
    setUpsCenter(selectedCenter);
  }, [slic, centers, customers]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
      }}
    >
      <Heading />
      <SelectDest
        slic={slic}
        setSlic={setSlic}
        checked={checked}
        setChecked={setChecked}
        init={init}
        customers={customers}
        centers={centers}
      />
      {checked ? (
        <Box
          sx={{
            width: { xs: '100%', sm: '90%', md: '35rem' },
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <UPSCenterInfo upsCenter={upsCenter} slic={slic} />
        </Box>
      ) : (
        <Box
          sx={{
            width: { xs: '100%', sm: '90%', md: '35rem' },
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <CustomerInfo customer={customer} slic={slic} />

          <DestInfo
            slic={slic}
            customer={customer}
            customers={customers}
            comments={comments}
            session={session}
            user={user}
          />
        </Box>
      )}
    </Box>
  );
}
