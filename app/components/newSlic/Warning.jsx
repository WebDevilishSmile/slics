import { Alert, Snackbar } from '@mui/material';

function Warning({ open, message, onClose }) {
  return (
    <>
      <Snackbar
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        open={open}
        message={message}
        onClose={onClose}
        slotProps={{
          clickAwayListener: {
            onClickAway: (event) => {
              // Prevent's default 'onClickAway' behavior.
              event.defaultMuiPrevented = true;
            },
          },
        }}
      >
        <Alert onClose={onClose} severity='warning' variant='filled'>
          {message}
        </Alert>
      </Snackbar>
    </>
  );
}

export default Warning;
