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
        mt: 2,
        gap: 2,
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
          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
        >
          <Apple />
          Apple Maps
        </Button>
      )}
      {slic.type === 'center' && slic.phone && (
        <Button
          variant='contained'
          href={`tel:${slic.phone}`}
          target='_blank'
          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
        >
          <PhoneOutlined /> {slic.alphaSlic} Dispatch
        </Button>
      )}
    </Box>
  );
}

export default MapPhoneLinks;
