'use client';

import { useState } from 'react';
import { Close, MoreHoriz } from '@mui/icons-material';
import {
  Box,
  Dialog,
  DialogTitle,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  TableCell,
} from '@mui/material';
import EditDriverField from './editDriver/EditDriverField';

function DriversTableOptions({ driver }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleOpenDialog = () => {
    setOpenDialog(true);
    handleClose();
    console.log(driver);
  };

  return (
    <TableCell sx={{ width: '2rem' }}>
      <IconButton size='small' onClick={handleClick}>
        <MoreHoriz />
      </IconButton>

      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        <MenuItem onClick={handleOpenDialog}>Edit driver</MenuItem>
        <MenuItem>Delete driver</MenuItem>
      </Menu>

      <Dialog
        fullScreen
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        slotProps={{
          paper: {
            sx: {
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              pt: '10rem',
            },
          },
        }}
      >
        {/* Driver details pop-up */}
        <IconButton
          onClick={() => setOpenDialog(false)}
          sx={{ position: 'absolute', top: '1rem', right: '1rem' }}
        >
          <Close />
        </IconButton>

        <DialogTitle>Driver Details</DialogTitle>
        <Divider width='90%' />

        <Box
          sx={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            px: '2rem',
            mt: '2rem',
            gap: '1rem',
          }}
        >
          <EditDriverField
            driver={driver}
            fieldName='name'
            label='Driver Name'
          />
          <EditDriverField
            driver={driver}
            fieldName='employeeId'
            label='Employee ID'
          />
          <EditDriverField
            driver={driver}
            fieldName='seniorityDate'
            label='Seniority Date'
          />
          <EditDriverField driver={driver} fieldName='phone' label='Phone' />
        </Box>
      </Dialog>
    </TableCell>
  );
}

export default DriversTableOptions;
