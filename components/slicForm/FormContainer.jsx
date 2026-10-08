import theme from '@/theme';
import { Paper } from '@mui/material';

function FormContainer({ children }) {
  return (
    <Paper
      variant='panel'
      sx={{
        maxWidth: theme.layout.width.wide,
        minHeight: 0,
        mt: 4,
      }}
    >
      {children}
    </Paper>
  );
}

export default FormContainer;
