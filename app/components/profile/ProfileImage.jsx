import Image from 'next/image';
import { Paper } from '@mui/material';
import theme from '@/utils/theme';

function ProfileImage({ userData }) {
  return (
    <Paper
      elevation={theme.layout.elevation}
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
