import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from '@mui/material';
import { 
  Edit as EditIcon, 
  Save as SaveIcon,
  Close as CloseIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import axiosInstance from '../utils/axiosInstance';
import GenerateGuidanceReport from '../components/GenerateGuidanceReport';

function ReportSummary({ reportId }) {
  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [summary, setSummary] = useState('');
  const [originalSummary, setOriginalSummary] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);

  useEffect(() => {
    const fetchSummaryData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!reportId) {
          throw new Error('Invalid report ID');
        }

        const response = await axiosInstance.get('/get_summary_text', {
          params: { report_id: reportId }
        });

        const { summary: reportSummary } = response.data;
        setSummary(reportSummary || '');
        setOriginalSummary(reportSummary || '');

        setLoading(false);
      } catch (error) {
        console.error('Error fetching summary data:', error);
        setError('Failed to load summary data. Please try again.');
        setLoading(false);
      }
    };

    fetchSummaryData();
  }, [reportId]);

  const handleEditClick = () => {
    setOpenDialog(true);
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
  };

  const handleConfirmEdit = () => {
    setOpenDialog(false);
    setIsEditingSummary(true);
  };

  const handleSaveSummary = async () => {
    try {
      setSaving(true);
      setError(null);

      if (!reportId) {
        throw new Error('Invalid report ID');
      }

      await axiosInstance.post('/edit_summary_text', {
        report_id: reportId,
        updated_summary_text: summary,
      });

      setOriginalSummary(summary);
      setIsEditingSummary(false);
    } catch (error) {
      console.error('Error saving summary:', error);
      setError(error.response?.data?.message || 'Failed to save summary. Please try again.');
      // Revert to original summary on error
      setSummary(originalSummary);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelSummary = () => {
    setSummary(originalSummary);
    setIsEditingSummary(false);
  };

  return (
    <Box>
      {error ? (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography color="error" align="center">
            {error}
          </Typography>
        </Paper>
      ) : loading ? (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <CircularProgress />
          </Box>
        </Paper>
      ) : (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                mb: 2,
                alignItems: 'center',
              }}
            >
              <Typography variant="h6">Report Summary</Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {isEditingSummary && (
                  <Button 
                    onClick={handleCancelSummary}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  variant="contained"
                  startIcon={isEditingSummary ? <SaveIcon /> : <EditIcon />}
                  onClick={isEditingSummary ? handleSaveSummary : handleEditClick}
                  disabled={saving}
                >
                  {isEditingSummary ? (saving ? 'Saving...' : 'Save') : 'Edit'}
                </Button>
                <GenerateGuidanceReport 
                  reportId={reportId} 
                  onError={setError}
                />
              </Box>
            </Box>

            <TextField
              fullWidth
              multiline
              minRows={10}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              disabled={!isEditingSummary || saving}
              variant="standard"
              InputProps={{
                disableUnderline: !isEditingSummary,
              }}
              sx={{
                '& .MuiInputBase-input.Mui-disabled': {
                  WebkitTextFillColor: 'rgba(0, 0, 0, 0.87)',
                  color: 'text.primary',
                  padding: 0,
                },
                '& .MuiInputBase-root': {
                  padding: 0,
                },
              }}
            />
          </Box>
        </Paper>
      )}

      <Dialog 
        open={openDialog} 
        onClose={handleDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          pb: 1
        }}>
          <InfoIcon sx={{ color: '#FFA500' }} />
          <Typography variant="h6">Edit Information</Typography>
          <IconButton
            aria-label="close"
            onClick={handleDialogClose}
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
            Your updated information will be used for model fine-tuning, enhancing its performance. 
            Providing detailed explanations and reasoning will further improve its accuracy and 
            effectiveness over time.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleConfirmEdit}
            startIcon={<EditIcon />}
          >
            Continue Editing
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ReportSummary;
