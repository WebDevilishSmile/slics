import { ELEVATION } from '@/utils/variables';
import { Paper } from '@mui/material';
import Image from 'next/image';

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
