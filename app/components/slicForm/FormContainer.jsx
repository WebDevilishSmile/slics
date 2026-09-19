import { Paper } from '@mui/material';

function FormContainer({ children }) {
  return (
    <Paper
      sx={{
        width: '100%',
        maxWidth: '52rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: '2rem',
        mt: '2rem',
      }}
    >
      {children}
    </Paper>
  );
}

export default FormContainer;
