import { useState } from 'react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  CircularProgress,
  Box,
} from '@mui/material';
import { 
  CheckCircle as CheckCircleIcon,
  Close as CloseIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import axiosInstance from '../utils/axiosInstance';

function GenerateGuidanceReport({ 
  reportId, 
  onError,
  hasSummaryChanges = false,
  hasAnalysisChanges = false,
  hasChatChanges = false,
}) {
  const [openSuccessDialog, setOpenSuccessDialog] = useState(false);
  const [openWarningDialog, setOpenWarningDialog] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);

  const handleGenerateGuidanceReport = async () => {
    // Check if any changes have been made
    if (!hasSummaryChanges && !hasAnalysisChanges && !hasChatChanges) {
      setOpenWarningDialog(true);
      return;
    }

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

  const handleCloseWarningDialog = () => {
    setOpenWarningDialog(false);
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

      {/* Success Dialog */}
      <Dialog
        open={openSuccessDialog}
        onClose={handleCloseSuccessDialog}
        maxWidth="sm"
        fullWidth
      >
        <Box sx={{ p: 2, pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <CheckCircleIcon sx={{ color: '#4CAF50' }} />
          <Typography variant="h6" component="div" sx={{ flex: 1 }}>
            Success
          </Typography>
          <IconButton
            aria-label="close"
            onClick={handleCloseSuccessDialog}
            size="small"
          >
            <CloseIcon />
          </IconButton>
        </Box>
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

      {/* Warning Dialog */}
      <Dialog
        open={openWarningDialog}
        onClose={handleCloseWarningDialog}
        maxWidth="sm"
        fullWidth
      >
        <Box sx={{ p: 2, pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon sx={{ color: '#FFA500' }} />
          <Typography variant="h6" component="div" sx={{ flex: 1 }}>
            No Changes Detected
          </Typography>
          <IconButton
            aria-label="close"
            onClick={handleCloseWarningDialog}
            size="small"
          >
            <CloseIcon />
          </IconButton>
        </Box>
        <DialogContent>
          <Typography variant="body1" sx={{ mt: 2, textAlign: 'justify' }}>
            No changes detected. Please modify the tool response before clicking the 'Generate Guidance Report' button.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button 
            variant="contained" 
            onClick={handleCloseWarningDialog}
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