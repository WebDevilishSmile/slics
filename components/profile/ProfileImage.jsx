'use client';

import Image from 'next/image';
import { Box } from '@mui/material';

import { softRaised } from '@/components/utility/soft';

// The avatar on a raised soft ring (utility/soft.js).
function ProfileImage({ userData }) {
  return (
    <Box sx={[softRaised, { borderRadius: '50%', p: 0.75, display: 'flex' }]}>
      <Box
        sx={{
          width: '100px',
          height: '100px',
          borderRadius: '50%',
          overflow: 'hidden',
          display: 'flex',
        }}
      >
        <Image
          src={userData.image || '/default-avatar.png'}
          alt={userData.name}
          width={100}
          height={100}
        />
      </Box>
    </Box>
  );
}

export default ProfileImage;
