import { CoffeeOutlined } from '@mui/icons-material';
import { Button, Paper, Typography } from '@mui/material';

function EmptySlic() {
  return (
    <Paper
      sx={{
        width: '100%',
        maxWidth: '40rem',
        minHeight: '36rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        mt: '2rem',
        py: '2rem',
        px: '1rem',
      }}
    >
      <Typography variant='h4' sx={{ textAlign: 'center', mb: '1rem' }}>
        Please choose a SLIC to view details
      </Typography>

      <Typography>
        I put a lot of work into making this app. Countless hours went into the
        design, development, and testing. If you can, please consider supporting
        the project by donating at the link below. Your support helps.
      </Typography>
      <Button
        variant='contained'
        href=''
        sx={{ display: 'flex', gap: '1rem', mt: '1.6rem' }}
      >
        <CoffeeOutlined /> Buy me a coffee
      </Button>
    </Paper>
  );
}

export default EmptySlic;
