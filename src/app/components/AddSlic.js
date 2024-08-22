import { Box, Button, Modal, Paper } from '@mui/material';
import AddSlicModal from './AddSlicModal';
import { useState } from 'react';

export default function AddSlic() {
  const [openAddSlic, setOpenAddSlic] = useState(false);

  function openModal() {
    setOpenAddSlic(true);
  }
  function closeModal() {
    setOpenAddSlic(false);
  }

  return (
    <Box sx={{ mb: '2rem' }}>
      <Button variant='contained' onClick={openModal}>
        Add new SLIC
      </Button>

      <Modal open={openAddSlic} onClose={closeModal}>
        <Box
          sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <AddSlicModal handleCloseModal={closeModal} />
        </Box>
      </Modal>
    </Box>
  );
}
