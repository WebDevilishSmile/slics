'use client';

import {
  AddBoxOutlined,
  IosShare,
  TaskAltOutlined,
} from '@mui/icons-material';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';

// iOS has no install prompt an app can trigger; the only path is the share
// sheet, so this walks the user through it.
const steps = [
  {
    icon: <IosShare />,
    primary: 'Tap the Share button',
    secondary:
      "In Safari it's in the bar at the bottom of the screen; in other browsers it's next to the address bar.",
  },
  {
    icon: <AddBoxOutlined />,
    primary: 'Choose "Add to Home Screen"',
    secondary: "Scroll down the share sheet if you don't see it.",
  },
  {
    icon: <TaskAltOutlined />,
    primary: 'Tap Add',
    secondary: 'SLICs appears on your home screen and opens like an app.',
  },
];

function IosInstallDialog({ open, onClose }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby='ios-install-title'
      fullWidth
      maxWidth='xs'
    >
      <DialogTitle id='ios-install-title'>
        Add SLICs to your home screen
      </DialogTitle>
      <DialogContent>
        <List disablePadding>
          {steps.map((step, index) => (
            <ListItem key={step.primary} disableGutters alignItems='flex-start'>
              <ListItemIcon sx={{ mt: 0.5 }}>{step.icon}</ListItemIcon>
              <ListItemText
                primary={`${index + 1}. ${step.primary}`}
                secondary={step.secondary}
              />
            </ListItem>
          ))}
        </List>
        <DialogContentText sx={{ mt: 1 }}>
          The first time you open it from the home screen you&apos;ll be asked
          to sign in again — that&apos;s expected.
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Got it</Button>
      </DialogActions>
    </Dialog>
  );
}

export default IosInstallDialog;
