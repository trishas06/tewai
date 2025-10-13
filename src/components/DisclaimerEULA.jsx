import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Checkbox,
  FormControlLabel,
  Button,
  Alert,
  Divider,
} from '@mui/material';
import { ExpandMore, Warning } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

function DisclaimerEULA({ onAccept, isAccepted }) {
  const [acknowledged, setAcknowledged] = useState(isAccepted);
  const [showError, setShowError] = useState(false);
  const theme = useTheme();

  const handleAcceptClick = () => {
    if (acknowledged) {
      onAccept();
      setShowError(false);
    } else {
      setShowError(true);
    }
  };

  const handleCheckboxChange = (event) => {
    setAcknowledged(event.target.checked);
    if (event.target.checked) {
      setShowError(false);
    }
  };

  return (
    <Paper
      elevation={2}
      sx={{
        p: 3,
        mb: 3,
        border: `2px solid ${
          acknowledged ? theme.palette.success.main : theme.palette.error.main
        }`,
        borderColor: acknowledged ? 'success.main' : 'error.main',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" fontWeight="bold">
          IMPORTANT - TERMS OF USE & CONFIDENTIALITY AGREEMENT
        </Typography>
      </Box>

      <Alert severity="error" sx={{ mb: 3 }}>
        <Typography variant="body2" fontWeight="bold">
          ACCESS TO THIS SYSTEM REQUIRES ACCEPTANCE OF THE FOLLOWING TERMS
        </Typography>
      </Alert>

      <Typography variant="subtitle1" fontWeight="bold">
        📋 Terms of Use & Confidentiality
      </Typography>

      <Box sx={{ textAlign: 'left' }}>
        <Typography variant="h6" gutterBottom color="primary" fontWeight="bold">
          CONFIDENTIALITY AND PROPRIETARY RIGHTS NOTICE
        </Typography>

        <Typography variant="body2" paragraph>
          By accessing this system, you acknowledge and agree to the following
          terms:
        </Typography>

        <Typography
          variant="subtitle2"
          fontWeight="bold"
          gutterBottom
          sx={{ mt: 2 }}
        >
          🚫 STRICTLY PROHIBITED ACTIVITIES:
        </Typography>
        <Box component="ul" sx={{ pl: 2, mb: 2 }}>
          <Typography component="li" variant="body2">
            <strong>Photography:</strong> Taking pictures, screenshots, or any
            form of visual capture of this application
          </Typography>
          <Typography component="li" variant="body2">
            <strong>Recording:</strong> Audio or video recording of any part of
            this system
          </Typography>
          <Typography component="li" variant="body2">
            <strong>Copying:</strong> Reproducing, duplicating, or copying any
            content, code, or functionality
          </Typography>
          <Typography component="li" variant="body2">
            <strong>Sharing:</strong> Distributing, sharing, or transmitting any
            information from this system
          </Typography>
          <Typography component="li" variant="body2">
            <strong>Reverse Engineering:</strong> Attempting to reverse
            engineer, decompile, or analyze system architecture
          </Typography>
          <Typography component="li" variant="body2">
            <strong>Unauthorized Access:</strong> Sharing login credentials or
            allowing unauthorized access
          </Typography>
        </Box>

        <Typography
          variant="subtitle2"
          fontWeight="bold"
          gutterBottom
          sx={{ mt: 2 }}
        >
          🔒 CONFIDENTIALITY OBLIGATIONS:
        </Typography>
        <Box component="ul" sx={{ pl: 2, mb: 2 }}>
          <Typography component="li" variant="body2">
            All information accessed through this system is confidential and
            proprietary
          </Typography>
          <Typography component="li" variant="body2">
            You must maintain strict confidentiality of all data, reports, and
            system functionality
          </Typography>
          <Typography component="li" variant="body2">
            Information may not be disclosed to any third party without explicit
            written authorization
          </Typography>
          <Typography component="li" variant="body2">
            This confidentiality obligation survives termination of your access
          </Typography>
        </Box>

        <Typography
          variant="subtitle2"
          fontWeight="bold"
          gutterBottom
          sx={{ mt: 2 }}
        >
          ⚖️ LEGAL CONSEQUENCES:
        </Typography>
        <Box component="ul" sx={{ pl: 2, mb: 2 }}>
          <Typography component="li" variant="body2">
            Violation of these terms may result in immediate termination of
            access
          </Typography>
          <Typography component="li" variant="body2">
            Legal action may be pursued for unauthorized use or disclosure
          </Typography>
          <Typography component="li" variant="body2">
            You may be held liable for damages resulting from breaches
          </Typography>
        </Box>

        <Typography
          variant="subtitle2"
          fontWeight="bold"
          gutterBottom
          sx={{ mt: 2 }}
        >
          📱 MONITORING AND COMPLIANCE:
        </Typography>
        <Box component="ul" sx={{ pl: 2, mb: 2 }}>
          <Typography component="li" variant="body2">
            All system access and activities are monitored and logged
          </Typography>
          <Typography component="li" variant="body2">
            Access logs may be reviewed for compliance and security purposes
          </Typography>
          <Typography component="li" variant="body2">
            Suspicious activities will be investigated and may result in access
            suspension
          </Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Typography
          variant="body2"
          sx={{ fontStyle: 'italic', color: 'text.secondary' }}
        >
          This system contains proprietary and confidential information. By
          proceeding, you agree to be bound by these terms and acknowledge that
          you understand the serious nature of these obligations.
        </Typography>
      </Box>

      {showError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          You must acknowledge and accept the terms above before proceeding.
        </Alert>
      )}

      <Box
        sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
      >
        <FormControlLabel
          control={
            <Checkbox
              checked={acknowledged}
              onChange={handleCheckboxChange}
              color="primary"
              sx={{ '& .MuiSvgIcon-root': { fontSize: 28 } }}
            />
          }
          label={
            <Typography variant="body1" fontWeight="bold">
              I have read, understood, and agree to comply with all terms and
              conditions stated above. I understand that violation of these
              terms may result in legal consequences.
            </Typography>
          }
          sx={{ mb: 2, alignItems: 'flex-start' }}
        />

        <Button
          variant="contained"
          size="large"
          onClick={handleAcceptClick}
          disabled={!acknowledged}
          sx={{
            px: 4,
            py: 1.5,
            fontWeight: 'bold',
            fontSize: '1.1rem',
          }}
        >
          Accept Terms and Continue to Login
        </Button>
      </Box>
    </Paper>
  );
}

export default DisclaimerEULA;
