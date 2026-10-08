'use client';

import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
} from '@mui/material';
import { useEffect, useState } from 'react';

import theme from '@/theme';
import { softTableSx } from '../utility/soft';
import DriversTableFooter from './DriversTableFooter';
import DriversTableHead from './DriversTableHead';
import DriversTableOptions from './DriversTableOptions';
import SearchAddDriver from './SearchAddDriver';

function DriversTable({ allDrivers }) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredDrivers, setFilteredDrivers] = useState(allDrivers);

  useEffect(() => {
    setFilteredDrivers(allDrivers);
    setSearchTerm('');
  }, [allDrivers]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    const filtered = allDrivers.filter((driver) => {
      const nameMatch = driver.name.toLowerCase().includes(term.toLowerCase());
      return nameMatch;
    });
    setFilteredDrivers(filtered);
  };

  return (
    <Paper
      variant='panel'
      sx={{
        maxWidth: theme.layout.width.prose,
        minHeight: 0,
        alignItems: 'stretch',
        px: { xs: 1, sm: 3 },
      }}
    >
      <SearchAddDriver
        drivers={allDrivers}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filteredDrivers={filteredDrivers}
        handleSearch={handleSearch}
      />

      <TableContainer>
        <Table size='small' sx={softTableSx}>
          <DriversTableHead />
          <TableBody>
            {filteredDrivers
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((driver, index) => (
                <TableRow key={driver.employeeId}>
                  <TableCell sx={{ width: '2rem' }}>
                    {index + 1 + page * rowsPerPage}
                  </TableCell>
                  <TableCell>{driver.name}</TableCell>
                  <TableCell sx={{ width: '9rem' }}>
                    {/* Displaying the cleaned string directly */}
                    {driver.seniorityDate.includes('-A')
                      ? driver.seniorityDate.replace('-A', '')
                      : driver.seniorityDate}
                  </TableCell>
                  <DriversTableOptions driver={driver} />
                </TableRow>
              ))}
          </TableBody>
          <DriversTableFooter
            allDrivers={filteredDrivers}
            page={page}
            rowsPerPage={rowsPerPage}
            handleChangePage={handleChangePage}
            handleChangeRowsPerPage={handleChangeRowsPerPage}
          />
        </Table>
      </TableContainer>
    </Paper>
  );
}

export default DriversTable;
