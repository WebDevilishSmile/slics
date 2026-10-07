import { useAppleDevice } from '@/utils/clientFunctions';
import { mapsHref } from '@/utils/geo';
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
        href={mapsHref({ address: slic.address }, 'google')}
        target='_blank'
        startIcon={<Google />}
      >
        Google Maps
      </Button>
      {isAppleDevice && (
        <Button
          variant='contained'
          href={mapsHref({ address: slic.address }, 'apple')}
          target='_blank'
          startIcon={<Apple />}
        >
          Apple Maps
        </Button>
      )}
      {/* No target: a tel: link in a new tab opens an empty one on desktop. */}
      {slic.type === 'center' && slic.phone && (
        <Button
          variant='contained'
          href={`tel:${slic.phone}`}
          startIcon={<PhoneOutlined />}
        >
          {slic.alphaSlic} Dispatch
        </Button>
      )}
    </Box>
  );
}

export default MapPhoneLinks;
