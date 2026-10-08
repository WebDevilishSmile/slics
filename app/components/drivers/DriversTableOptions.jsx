'use client';

import { useState } from 'react';
import { MoreHoriz } from '@mui/icons-material';
import {
  IconButton,
  Menu,
  MenuItem,
  TableCell,
} from '@mui/material';
import EditDriverDialog from './editDriver/EditDriverDialog';
import DeleteDriverDialog from './DeleteDriverDialog';
import { softPressSx } from '../utility/soft';

function DriversTableOptions({ driver }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <TableCell sx={{ width: '2rem' }}>
      <IconButton
        size='small'
        onClick={handleClick}
        aria-label={`Options for ${driver.name}`}
        sx={softPressSx}
      >
        <MoreHoriz />
      </IconButton>

      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        <MenuItem onClick={() => setOpenEditDialog(true)}>Edit driver</MenuItem>
        <MenuItem onClick={() => setOpenDeleteDialog(true)}>
          Delete driver
        </MenuItem>
      </Menu>

      <EditDriverDialog
        openDialog={openEditDialog}
        setOpenDialog={setOpenEditDialog}
        driver={driver}
      />
      <DeleteDriverDialog
        openDialog={openDeleteDialog}
        setOpenDialog={setOpenDeleteDialog}
        driver={driver}
      />
    </TableCell>
  );
}

export default DriversTableOptions;
