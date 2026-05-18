'use client';

import { Box, Button, TextField } from '@mui/material';
import { useState } from 'react';
import NewDriverDialog from './newDriver/NewDriverDialog';

export default function SearchAddDriver({
  drivers,
  searchTerm,
  setSearchTerm,
  filteredDrivers,
  handleSearch,
}) {
  const [openAddDialog, setOpenAddDialog] = useState(false);

  const handleOpenAddDialog = () => {
    setOpenAddDialog(true);
  };
  const handleCloseAddDialog = () => {
    setOpenAddDialog(false);
  };

  return (
    <Box
      sx={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        px: { xs: '1rem' },
        gap: '1rem',
        my: '2rem',
      }}
    >
      <TextField
        label='Search Drivers'
        variant='outlined'
        fullWidth
        value={searchTerm}
        onChange={(e) => handleSearch(e.target.value)}
      />
      <Button variant='contained' color='primary' onClick={handleOpenAddDialog}>
        Add New Driver
      </Button>

      <NewDriverDialog open={openAddDialog} onClose={handleCloseAddDialog} />
    </Box>
  );
}
