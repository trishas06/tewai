import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';
import { AccessTime as AccessTimeIcon } from '@mui/icons-material';

function SessionTimeoutDialog({ open, onClose }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 1,
          '& .MuiDialogTitle-root': {
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.default',
          },
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <AccessTimeIcon sx={{ color: 'warning.main' }} />
        Session Timeout
      </DialogTitle>
      <DialogContent sx={{ mt: 2 }}>
        <Typography variant="body1">
          Your session has expired due to inactivity. Please log in again to continue.
        </Typography>
      </DialogContent>
      <DialogActions
        sx={{
          p: 2,
          borderTop: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.default',
        }}
      >
        <Button
          onClick={onClose}
          variant="contained"
          sx={{ minWidth: 100 }}
        >
          Login
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default SessionTimeoutDialog; 