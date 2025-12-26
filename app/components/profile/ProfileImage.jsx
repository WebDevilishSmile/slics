import Image from 'next/image';
import { Paper } from '@mui/material';
import { ELEVATION } from '@/utils/variables';

function ProfileImage({ userData }) {
  return (
    <Paper
      elevation={ELEVATION}
      sx={{
        position: 'relative',
        width: '100px',
        height: '100px',
        marginTop: '1rem',
        borderRadius: '50%',
        overflow: 'hidden',
      }}
    >
      <Image
        src={userData.image || '/default-profile.png'}
        alt={userData.name}
        width={100}
        height={100}
      />
    </Paper>
  );
}

export default ProfileImage;
