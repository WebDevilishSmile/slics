import { Close } from '@mui/icons-material';
import { Box, Dialog, DialogTitle, Divider, IconButton } from '@mui/material';
import EditDriverField from './EditDriverField';

export default function EditDriverDialog({
  openDialog,
  setOpenDialog,
  driver,
}) {
  return (
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
        <EditDriverField driver={driver} fieldName='name' label='Driver Name' />
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
  );
}
