import { useAppleDevice } from '@/utils/clientFunctions';
import { Apple, Google, PhoneOutlined } from '@mui/icons-material';
import { Box, Button } from '@mui/material';

function MapPhoneLinks({ slic }) {
  const isAppleDevice = useAppleDevice();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        mt: '1.6rem',
        gap: '1.6rem',
      }}
    >
      <Button
        variant='contained'
        href={`https://www.google.com/maps/search/?api=1&query=${slic.address.street},${slic.address.city},${slic.address.zip}`}
        target='_blank'
      >
        <Google />
        oogle Maps
      </Button>
      {isAppleDevice && (
        <Button
          variant='contained'
          href={`http://maps.apple.com/?q=${slic.address.street},${slic.address.city},${slic.address.zip}`}
          target='_blank'
          sx={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}
        >
          <Apple />
          Apple Maps
        </Button>
      )}
      {slic.type === 'center' && (
        <Button
          variant='contained'
          href={`tel:${slic.phone}`}
          target='_blank'
          sx={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}
        >
          <PhoneOutlined /> {slic.alphaSlic} Dispatch
        </Button>
      )}
    </Box>
  );
}

export default MapPhoneLinks;
