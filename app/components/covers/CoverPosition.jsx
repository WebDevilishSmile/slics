'use client';

import { MoreHoriz } from '@mui/icons-material';
import {
  IconButton,
  Menu,
  MenuItem,
  TableCell,
  TableRow,
  TextField,
} from '@mui/material';
import { useState } from 'react';
import CoverSaveButton from './CoverSaveButton';

function CoverPosition({ cover, isEditing, setIsEditing, onSaveSuccess }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [coverName, setCoverName] = useState(cover.driverName);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <TableRow key={cover.position}>
      <TableCell>{cover.position}</TableCell>
      <TableCell
        sx={{
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {isEditing === cover._id ? (
          <TextField
            value={coverName}
            onChange={(e) => setCoverName(e.target.value)}
            fullWidth
            size='small'
          />
        ) : (
          cover.driverName
        )}
      </TableCell>
      <TableCell>
        <IconButton
          size='small'
          onClick={handleClick}
          disabled={isEditing !== cover._id && isEditing !== 0}
        >
          <MoreHoriz />
        </IconButton>

        <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
          {isEditing !== cover._id ? (
            <MenuItem
              onClick={() => {
                setIsEditing(cover._id);
                handleClose();
              }}
            >
              Edit
            </MenuItem>
          ) : (
            <MenuItem
              onClick={() => {
                setIsEditing(0);
                handleClose();
              }}
            >
              Cancel
            </MenuItem>
          )}
          {isEditing !== cover._id ? (
            <MenuItem onClick={handleClose}>Close</MenuItem>
          ) : (
            <CoverSaveButton
              handleClose={handleClose}
              coverName={coverName}
              position={cover.position}
              onSaveSuccess={onSaveSuccess}
            />
          )}
        </Menu>
      </TableCell>
    </TableRow>
  );
}

export default CoverPosition;
