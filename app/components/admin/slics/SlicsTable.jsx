'use client';

import theme from '@/utils/theme';
import { SLICS_PER_PAGE } from '@/utils/variables';
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
  const [sort, setSort] = useState('descending');
  const [filteredSlics, setFilteredSlics] = useState(slics);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Combined effect for filtering and sorting
  useEffect(() => {
    const query = search.toLowerCase();

    // Filter first
    const filtered = slics.filter((slic) => {
      const numSlicMatch = slic.numSlic?.toString().includes(query);
      const alphaSlicMatch = slic.alphaSlic
        ?.toString()
        .toLowerCase()
        .includes(query);
      const nameMatch = slic.name?.toLowerCase().includes(query);

      return numSlicMatch || alphaSlicMatch || nameMatch;
    });

    // Then sort
    const sortedSlics = [...filtered].sort((a, b) => {
      if (sortCategory === 'name') {
        const aName = a.name?.toLowerCase() || '';
        const bName = b.name?.toLowerCase() || '';
        if (aName < bName) return sort === 'ascending' ? -1 : 1;
        if (aName > bName) return sort === 'ascending' ? 1 : -1;
        return 0;
      } else {
        const aValue = a[sortCategory];
        const bValue = b[sortCategory];

        if (aValue < bValue) return sort === 'ascending' ? -1 : 1;
        if (aValue > bValue) return sort === 'ascending' ? 1 : -1;
        return 0;
      }
    });

    setFilteredSlics(sortedSlics);
    setPage(0); // Reset to first page on search or sort change
  }, [search, slics, sort, sortCategory]);

  return (
    <Paper sx={{ width: '100%', maxWidth: theme.layout.width.wide, mt: 4 }}>
      <Box
        sx={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          px: 2,
          pt: 2,
          pb: 2,
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
