import { useState } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  CircularProgress,
} from '@mui/material';
import { 
  CheckCircle as CheckCircleIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import axiosInstance from '../utils/axiosInstance';

function GenerateGuidanceReport({ reportId, onError }) {
  const [openSuccessDialog, setOpenSuccessDialog] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);

  const handleGenerateGuidanceReport = async () => {
    try {
      setGeneratingReport(true);

      const userData = JSON.parse(localStorage.getItem('user'));
      if (!userData || !userData.name) {
        throw new Error('User data not found');
      }

      await axiosInstance.post('/generate_guidance_report', {
        report_id: reportId,
        user_id: userData.name
      });

      setOpenSuccessDialog(true);
    } catch (error) {
      console.error('Error generating guidance report:', error);
      if (onError) {
        onError(error.response?.data?.message || 'Failed to generate guidance report. Please try again.');
      }
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleCloseSuccessDialog = () => {
    setOpenSuccessDialog(false);
  };

  return (
    <>
      <Button
        variant="contained"
        color="primary"
        onClick={handleGenerateGuidanceReport}
        disabled={generatingReport}
        startIcon={generatingReport ? <CircularProgress size={20} /> : null}
      >
        {generatingReport ? 'Generating...' : 'Generate Guidance Report'}
      </Button>

      <Dialog
        open={openSuccessDialog}
        onClose={handleCloseSuccessDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          pb: 1
        }}>
          <CheckCircleIcon sx={{ color: '#4CAF50' }} />
          <Typography variant="h6">Success</Typography>
          <IconButton
            aria-label="close"
            onClick={handleCloseSuccessDialog}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mt: 2, textAlign: 'justify' }}>
            Modified Guidance Report has been uploaded on S3.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button 
            variant="contained" 
            onClick={handleCloseSuccessDialog}
            color="primary"
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default GenerateGuidanceReport; 