import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  CircularProgress,
} from '@mui/material';
import { Edit as EditIcon, Save as SaveIcon } from '@mui/icons-material';
import axiosInstance from '../utils/axiosInstance';

function ReportSummary({ reportId }) {
  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [summary, setSummary] = useState('');
  const [originalSummary, setOriginalSummary] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const handleEditSummary = () => {
    setOriginalSummary(summary);
    setIsEditingSummary(true);
  };

  const handleSaveSummary = async () => {
    try {
      // TODO: API call to save summary
      setIsEditingSummary(false);
    } catch (error) {
      console.error('Error saving summary:', error);
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
                  <Button onClick={handleCancelSummary}>Cancel</Button>
                )}
                <Button
                  variant="contained"
                  startIcon={isEditingSummary ? <SaveIcon /> : <EditIcon />}
                  onClick={
                    isEditingSummary ? handleSaveSummary : handleEditSummary
                  }
                >
                  {isEditingSummary ? 'Save' : 'Edit'}
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => {
                    // TODO: Implement guidance report generation
                    console.log('Generate guidance report');
                  }}
                >
                  Generate Guidance Report
                </Button>
              </Box>
            </Box>

            <TextField
              fullWidth
              multiline
              minRows={10}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              disabled={!isEditingSummary}
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
    </Box>
  );
}

export default ReportSummary;
