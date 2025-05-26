import {
  Box,
  Button,
  Checkbox,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import PageContainer from '../components/layout/PageContainer';
import { SortOutlined } from '@mui/icons-material';
import { getAllSlics } from '@/utils/slicsApi';
import TableHeader from '../components/admin/TableHeader';
import dayjs from 'dayjs';

async function AdminPage() {
  const slics = await getAllSlics();

  return (
    <PageContainer>
      <Typography variant='h2'>Admin Page</Typography>

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
          <Table>
            <TableHeader />

            <TableBody>
              {slics.map((slic) => (
                <TableRow key={slic._id}>
                  <TableCell>
                    {dayjs(slic.created_at).format('MM/DD/YY')}
                  </TableCell>
                  <TableCell>{slic.numSlic}</TableCell>
                  <TableCell>{slic.alphaSlic}</TableCell>
                  <TableCell>{slic.name}</TableCell>
                  <TableCell>
                    <Checkbox />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </PageContainer>
  );
}

export default AdminPage;
