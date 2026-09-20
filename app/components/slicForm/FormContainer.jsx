import theme from '@/utils/theme';
import { Paper } from '@mui/material';

function FormContainer({ children }) {
  return (
    <Paper
      sx={{
        width: '100%',
        maxWidth: theme.layout.width.wide,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 4,
        mt: 4,
      }}
    >
      {children}
    </Paper>
  );
}

export default FormContainer;
