'use client';

import { SearchOutlined } from '@mui/icons-material';
import { Box, Button, InputAdornment, TextField } from '@mui/material';
import { useState } from 'react';
import { softContainedSx, softInputSx } from '@/components/utility/soft';
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
        alignItems: 'stretch',
        gap: 2,
        pb: 2,
      }}
    >
      <TextField
        placeholder='Search drivers'
        aria-label='Search drivers'
        fullWidth
        sx={softInputSx}
        value={searchTerm}
        onChange={(e) => handleSearch(e.target.value)}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position='start'>
                <SearchOutlined />
              </InputAdornment>
            ),
          },
        }}
      />
      <Button
        variant='contained'
        color='primary'
        onClick={handleOpenAddDialog}
        sx={[softContainedSx, { alignSelf: 'center', minHeight: '3rem', px: 3 }]}
      >
        Add New Driver
      </Button>

      <NewDriverDialog open={openAddDialog} onClose={handleCloseAddDialog} />
    </Box>
  );
}
