import { ExpandMore } from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Typography,
} from '@mui/material';

export default function JobSelected({ job }) {
  return (
    <Box
      sx={{
        width: { xs: '90%', sm: '90%', md: '35rem' },
        display: 'flex',
        flexDirection: 'column',
        mt: '1rem',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-end',
          padding: '0 1rem',
        }}
      >
        <Typography variant='h6'>Job Name:</Typography>
        <Typography sx={{ fontSize: '1.2rem', ml: '1rem' }}>
          {job.name}
        </Typography>
      </Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-end',
          padding: '0 1rem',
        }}
      >
        <Typography variant='h6'>Start Time:</Typography>
        <Typography sx={{ fontSize: '1.2rem', ml: '1rem' }}>
          {job.start}
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          padding: '0 1rem',
          mt: '2rem',
        }}
      >
        <Typography variant='h6' sx={{ mb: '1rem' }}>
          Route Description
        </Typography>
        {job.route.map((rt, i) => {
          return (
            <Accordion key={i}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                {rt.name}
              </AccordionSummary>
              <AccordionDetails
                sx={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                >
                  <Typography sx={{ fontWeight: '600' }}>SLIC:</Typography>
                  <Typography sx={{ ml: '1rem' }}>{rt.slic}</Typography>
                </Box>

                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                >
                  <Typography sx={{ fontWeight: '600' }}>Equip:</Typography>
                  <Typography sx={{ ml: '1rem' }}>{rt.equipment}</Typography>
                </Box>

                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                >
                  <Typography sx={{ fontWeight: '600' }}>Desc:</Typography>
                  <Typography sx={{ ml: '1rem' }}>{rt.description}</Typography>
                </Box>

                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                >
                  <Typography sx={{ fontWeight: '600' }}>Pull Time:</Typography>
                  <Typography sx={{ ml: '1rem' }}>{rt.pullTime}</Typography>
                </Box>

                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                >
                  <Typography sx={{ fontWeight: '600' }}>Meal?:</Typography>
                  <Typography sx={{ ml: '1rem' }}>{rt.meal}</Typography>
                </Box>

                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <Typography sx={{ fontWeight: '600' }}>Comments:</Typography>
                  <Box sx={{ ml: '1rem' }}>
                    {rt.comments.map((com, i) => {
                      return <Typography key={i}>{com.com}</Typography>;
                    })}
                  </Box>
                </Box>
              </AccordionDetails>
            </Accordion>
          );
        })}
      </Box>
    </Box>
  );
}
