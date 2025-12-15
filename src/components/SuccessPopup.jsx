import { Snackbar, Alert } from '@mui/material';

const SuccessPopup = ({ open, onClose, message = 'Changes saved successfully!' }) => {
  return (
    <Snackbar
      open={open}
      autoHideDuration={5000}
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
    >
      <Alert
        onClose={onClose}
        severity="success"
        variant="filled"
        sx={{
          color: '#ffffff',
          fontSize: '1rem',
          '& .MuiAlert-message': {
            display: 'flex',
            alignItems: 'center',
          },
        }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
};

export default SuccessPopup; 