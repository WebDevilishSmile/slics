import { MenuItem } from '@mui/material';

function CoverSaveButton({ position, coverName, handleClose, onSaveSuccess }) {
  const handleSave = async () => {
    try {
      const response = await fetch(`/api/cover/${position}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverName: coverName }),
      });

      if (response.ok) {
        // This tells the parent to refresh the data or exit edit mode
        onSaveSuccess();
        handleClose();
      }
    } catch (error) {
      console.error('Failed to save:', error);
    }
  };

  return <MenuItem onClick={handleSave}>Save</MenuItem>;
}

export default CoverSaveButton;
