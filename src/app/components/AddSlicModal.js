import {
  Box,
  Button,
  IconButton,
  Paper,
  TextField,
  Typography,
} from '@mui/material';

export default function AddCommentModal({ handleCloseModal }) {
  return (
    <Paper
      sx={{
        width: '100vw',
        p: '1rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <IconButton
        sx={{ position: 'absolute', right: '1rem' }}
        onClick={handleCloseModal}
      >
        X
      </IconButton>
      <Typography
        align='center'
        textTransform='uppercase'
        variant='h5'
        sx={{ mt: '2rem' }}
      >
        Add New SLIC
      </Typography>

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          width: '100%',
          p: '2rem',
        }}
      >
        <TextField size='small' fullWidth label='Numerical Slic' />
        <TextField size='small' fullWidth label='Alpha Slic' />
        <TextField size='small' fullWidth label='Name' />
        <TextField size='small' fullWidth label='Street Address' />
        <TextField size='small' fullWidth label='City' />
        <TextField size='small' fullWidth label='State' />
        <TextField size='small' fullWidth label='ZipCode' />
      </Box>

      <Button variant='contained' sx={{ mt: '1rem' }}>
        Save
      </Button>
    </Paper>
  );
}
