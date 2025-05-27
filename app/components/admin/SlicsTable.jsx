'use client';

import { SortByAlphaOutlined, SortOutlined } from '@mui/icons-material';
import {
  Box,
  Button,
  Paper,
  Table,
  TableContainer,
  TableFooter,
  TablePagination,
  TableRow,
  TextField,
} from '@mui/material';
import { useEffect, useState } from 'react';
import SlicsBody from './SlicsBody';
import TableHeader from './TableHeader';
import { SLICS_PER_PAGE } from '@/utils/variables';
import SlicsFilter from './SlicsFilter';

function SlicsTable({ slics }) {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('ascending');
  const [filteredSlics, setFilteredSlics] = useState(slics);

  const handleSort = () => {
    if (sort === 'ascending') {
      setFilteredSlics(
        [...filteredSlics].sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        )
      );
      setSort('descending');
    } else {
      setFilteredSlics(
        [...filteredSlics].sort(
          (a, b) => new Date(a.created_at) - new Date(b.created_at)
        )
      );
      setSort('ascending');
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  useEffect(() => {
    const query = search.toLowerCase();

    const result = slics.filter((slic) => {
      const numSlicMatch = slic.numSlic?.toString().includes(query);
      const alphaSlicMatch = slic.alphaSlic
        ?.toString()
        .toLowerCase()
        .includes(query);
      const nameMatch = slic.name?.toLowerCase().includes(query);

      return numSlicMatch || alphaSlicMatch || nameMatch;
    });

    setFilteredSlics(result);
    setPage(0); // Reset to first page on search
  }, [search, slics]);
  return (
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
        <Button onClick={handleSort}>
          Date{' '}
          <SortOutlined
            sx={{
              transform: sort === 'ascending' ? 'rotateX(180deg)' : 'none',
            }}
          />
        </Button>

        <SlicsFilter search={search} setSearch={setSearch} />

        <Button href='/admin/new'>New SLIC</Button>
      </Box>
      <TableContainer>
        <Table>
          <TableHeader />

          <SlicsBody slics={filteredSlics} page={page} />

          <TableFooter>
            <TableRow>
              <TablePagination
                rowsPerPage={SLICS_PER_PAGE}
                rowsPerPageOptions={[]}
                onPageChange={handleChangePage}
                count={filteredSlics.length}
                page={page}
              />
            </TableRow>
          </TableFooter>
        </Table>
      </TableContainer>
    </Paper>
  );
}

export default SlicsTable;
