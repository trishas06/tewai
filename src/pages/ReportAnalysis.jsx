import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
  CircularProgress,
  Chip,
  Button,
  TextField,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Close as CloseIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import axiosInstance from '../utils/axiosInstance';

function ReportAnalysis({ reportId }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [analysisData, setAnalysisData] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [originalData, setOriginalData] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  originalData;
  useEffect(() => {
    const fetchAnalysisData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!reportId) {
          throw new Error('Report ID is required');
        }

        const response = await axiosInstance.get('/get_question_answer', {
          params: { report_id: reportId },
        });

        if (
          response.data.status === 'success' &&
          response.data.question_answer
        ) {
          // Store original data
          setOriginalData(response.data.question_answer);

          // Group questions by headerKey
          const groupedData = response.data.question_answer.reduce(
            (acc, item) => {
              const headerKey = item.headerKey || 'Other';
              if (!acc[headerKey]) {
                acc[headerKey] = [];
              }
              acc[headerKey].push({
                ...item,
                pageNumber: item.pageNumber,
                originalDescriptionKey: item.descriptionKey,
                originalPageNumber: item.pageNumber,
              });
              return acc;
            },
            {}
          );

          // Convert to array format
          const formattedData = Object.entries(groupedData).map(
            ([header, items]) => ({
              category: header,
              items,
            })
          );

          setAnalysisData(formattedData);
        } else {
          throw new Error('Invalid response format');
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching analysis data:', error);
        setError('Failed to load analysis data. Please try again.');
        setLoading(false);
      }
    };

    fetchAnalysisData();
  }, [reportId]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      // Prepare the update payload with all modified items
      const updatedItems = analysisData.flatMap((section) =>
        section.items.map((item) => {
          let data = {
            headerKey: section.category,
            descriptionKey: item.descriptionKey,
            pageNumber: item.pageNumber,
            question: item.question,
            ...(item?.record_updated
              ? { record_updated: item.record_updated }
              : {}),
          };
          if (
            item.descriptionKey !== item.originalDescriptionKey ||
            item.pageNumber !== item.originalPageNumber
          ) {
            return {
              ...data,
              record_updated: true,
            };
          }
          return data;
        })
      );

      if (updatedItems.length === 0) {
        setIsEditing(false);
        return;
      }

      // TODO: Add API call to save the updated data
      if (!reportId) {
        throw new Error('Invalid report ID');
      }

      await axiosInstance.post('/edit_question_answer', {
        report_id: reportId,
        updated_question_answer: updatedItems,
      });

      // Update original data with new values
      setOriginalData((prevData) =>
        prevData.map((item) => {
          const updatedItem = updatedItems.find(
            (updated) =>
              updated.question === item.question &&
              updated.headerKey === item.headerKey
          );
          return updatedItem || item;
        })
      );

      // Update original values in analysisData
      setAnalysisData((prevData) =>
        prevData.map((section) => ({
          ...section,
          items: section.items.map((item) => ({
            ...item,
            originalDescriptionKey: item.descriptionKey,
            originalPageNumber: item.pageNumber,
          })),
        }))
      );

      setIsEditing(false);
    } catch (error) {
      console.error('Error saving analysis data:', error);
      setError('Failed to save changes. Please try again.');
      handleCancel();
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Revert all changes to original values
    setAnalysisData((prevData) =>
      prevData.map((section) => ({
        ...section,
        items: section.items.map((item) => ({
          ...item,
          descriptionKey: item.originalDescriptionKey,
          pageNumber: item.originalPageNumber,
        })),
      }))
    );
    setIsEditing(false);
  };

  const handleInputChange = (category, question, field, value) => {
    setAnalysisData((prevData) =>
      prevData.map((section) => {
        if (section.category === category) {
          return {
            ...section,
            items: section.items.map((item) => {
              if (item.question === question) {
                return {
                  ...item,
                  [field]: value,
                };
              }
              return item;
            }),
          };
        }
        return section;
      })
    );
  };

  const handleEditClick = () => {
    setOpenDialog(true);
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
  };

  const handleConfirmEdit = () => {
    setOpenDialog(false);
    setIsEditing(true);
  };

  if (error) {
    return (
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography color="error" align="center">
          {error}
        </Typography>
      </Paper>
    );
  }

  if (loading) {
    return (
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      </Paper>
    );
  }

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
          }}
        >
          <Box>
            <Typography variant="h6" gutterBottom>
              Report Analysis
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Detailed analysis of the loss report based on key questions and
              findings
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {isEditing && (
              <Button
                variant="outlined"
                color="error"
                onClick={handleCancel}
                disabled={saving}
              >
                Cancel
              </Button>
            )}
            <Button
              variant="contained"
              startIcon={isEditing ? <SaveIcon /> : <EditIcon />}
              onClick={isEditing ? handleSave : handleEditClick}
              disabled={saving}
            >
              {isEditing ? (saving ? 'Saving...' : 'Save') : 'Edit'}
            </Button>
          </Box>
        </Box>

        {analysisData.map((section, index) => (
          <Accordion key={index} sx={{ mb: 1 }}>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls={`panel${index}-content`}
              id={`panel${index}-header`}
            >
              <Typography fontWeight="medium">{section.category}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {section.items.map((item, itemIndex) => (
                <Box
                  key={itemIndex}
                  sx={{
                    mb: itemIndex !== section.items.length - 1 ? 3 : 0,
                    p: 2,
                    bgcolor: 'background.default',
                    borderRadius: 1,
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    color="primary"
                    gutterBottom
                    sx={{ fontWeight: 'bold' }}
                  >
                    {item.question}
                  </Typography>
                  {isEditing ? (
                    <>
                      <TextField
                        fullWidth
                        multiline
                        minRows={3}
                        value={item.descriptionKey}
                        onChange={(e) =>
                          handleInputChange(
                            section.category,
                            item.question,
                            'descriptionKey',
                            e.target.value
                          )
                        }
                        disabled={saving}
                        sx={{ mb: 2 }}
                      />
                      <TextField
                        fullWidth
                        value={item.pageNumber}
                        onChange={(e) =>
                          handleInputChange(
                            section.category,
                            item.question,
                            'pageNumber',
                            e.target.value
                          )
                        }
                        disabled={saving}
                        sx={{ mb: 2 }}
                      />
                    </>
                  ) : (
                    <>
                      <Typography
                        variant="body2"
                        sx={{
                          whiteSpace: 'pre-wrap',
                          mb: 1,
                        }}
                      >
                        {item.descriptionKey}
                      </Typography>
                      <Chip
                        label={item.pageNumber}
                        size="small"
                        variant="filled"
                        color="primary"
                        sx={{
                          mt: 1,
                          bgcolor: '#e3f2fd',
                          color: '#1976d2',
                          fontWeight: 500,
                          border: '1px solid #90caf9',
                          '& .MuiChip-label': {
                            color: 'inherit',
                          },
                        }}
                      />
                    </>
                  )}
                </Box>
              ))}
            </AccordionDetails>
          </Accordion>
        ))}
      </Paper>

      <Dialog
        open={openDialog}
        onClose={handleDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            pb: 1,
          }}
        >
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
            Your updated information will be used for model fine-tuning,
            enhancing its performance. Providing detailed explanations and
            reasoning will further improve its accuracy and effectiveness over
            time.
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

export default ReportAnalysis;
