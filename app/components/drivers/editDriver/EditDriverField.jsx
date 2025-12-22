import { Cancel, Edit, Phone, Save } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Snackbar,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';

function EditDriverField({ driver, fieldName, label }) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(driver[fieldName] || '');
  const [currentDisplayValue, setCurrentDisplayValue] = useState(
    driver[fieldName] || ''
  );
  const [isLoading, setIsLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  const handleSaveClick = async () => {
    // 1. Basic Validation
    if (!value || value.toString().trim() === '') {
      setSnackbar({
        open: true,
        message: `${label} cannot be empty`,
        severity: 'error',
      });
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(`/api/drivers/${driver._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        // Dynamically sets the key: e.g., { name: "New Name" }
        body: JSON.stringify({ [fieldName]: value }),
      });

      if (!response.ok) throw new Error('Update failed');

      setCurrentDisplayValue(value);
      setIsEditing(false);
      setSnackbar({
        open: true,
        message: `${label} updated!`,
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Failed to update ${label}`,
        severity: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: '1rem', mb: 2 }}>
      {isEditing ? (
        <>
          <TextField
            size='small'
            label={label}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            disabled={isLoading}
            autoFocus
          />
          <IconButton onClick={handleSaveClick} disabled={isLoading}>
            {isLoading ? (
              <CircularProgress size={20} />
            ) : (
              <Save color='success' />
            )}
          </IconButton>
          <IconButton
            onClick={() => {
              setIsEditing(false);
              setValue(currentDisplayValue);
            }}
            disabled={isLoading}
          >
            <Cancel color='error' />
          </IconButton>
        </>
      ) : (
        <>
          <Typography>
            <strong>{label}:</strong>
          </Typography>

          <Typography
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              flexGrow: 1,
            }}
          >
            {currentDisplayValue || 'Not set'}{' '}
            {label === 'Phone' && (
              <Button
                sx={{ mt: '.3rem' }}
                variant='outlined'
                href={`tel:${currentDisplayValue}`}
                disabled={!currentDisplayValue}
              >
                <Phone />
              </Button>
            )}
          </Typography>
          <IconButton size='small' onClick={() => setIsEditing(true)}>
            <Edit fontSize='small' />
          </IconButton>
        </>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert variant='filled' severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
export default EditDriverField;
