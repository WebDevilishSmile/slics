import { serializeSlics } from '@/utils/functions';
import { getAllSlics } from '@/utils/slicsApi';
import { SortOutlined } from '@mui/icons-material';
import { Box, Button, Paper, TableContainer, Typography } from '@mui/material';
import SlicsTable from '../../components/admin/SlicsTable';
import PageContainer from '../../components/layout/PageContainer';
import BackButton from '@/app/components/layout/BackButton';

async function SlicsTablePage() {
  const slics = await getAllSlics();

  return (
    <PageContainer>
      <BackButton />
      <Typography variant='h2'>Slics</Typography>

      <Paper sx={{ width: '100%', maxWidth: '50rem', mt: '2rem' }}>
        <Box
          sx={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            px: '1rem',
            pt: '1rem',
          }}
        >
          <Button>
            Sort <SortOutlined />
          </Button>

          <Button href='/admin/new'>New SLIC</Button>
        </Box>
        <TableContainer>
          <SlicsTable slics={serializeSlics(slics)} />
        </TableContainer>
      </Paper>
    </PageContainer>
  );
}

export default SlicsTablePage;
