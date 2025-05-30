'use client';

import { SLICS_PER_PAGE } from '@/utils/variables';
import { SortOutlined } from '@mui/icons-material';
import {
  Box,
  Button,
  Paper,
  Table,
  TableContainer,
  TableFooter,
  TablePagination,
  TableRow,
} from '@mui/material';
import { useEffect, useState } from 'react';
import SlicsBody from './SlicsBody';
import SlicsFilter from './SlicsFilter';
import TableHeader from './TableHeader';

function SlicsTable({ slics }) {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [sortCategory, setSortCategory] = useState('created_at');
  const [sort, setSort] = useState('ascending');
  const [filteredSlics, setFilteredSlics] = useState(slics);

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

  useEffect(() => {
    const sortedSlics = [...filteredSlics].sort((a, b) => {
      const aValue = a[sortCategory];
      const bValue = b[sortCategory];

      if (aValue < bValue) return sort === 'ascending' ? -1 : 1;
      if (aValue > bValue) return sort === 'ascending' ? 1 : -1;
      return 0;
    });

    setFilteredSlics(sortedSlics);
  }, [sort, sortCategory]);

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
        <SlicsFilter search={search} setSearch={setSearch} />

        <Button href='/admin/new'>New SLIC</Button>
      </Box>
      <TableContainer>
        <Table>
          <TableHeader
            sort={sort}
            setSort={setSort}
            sortCategory={sortCategory}
            setSortCategory={setSortCategory}
          />

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
