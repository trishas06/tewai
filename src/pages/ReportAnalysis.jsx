import { useState, useEffect, useContext } from 'react';
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
  Tooltip,
  useMediaQuery,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  Info as InfoIcon,
  Flag as FlagIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import axiosInstance from '../utils/axiosInstance';
import GenerateGuidanceReport from '../components/GenerateGuidanceReport';
import SuccessPopup from '../components/SuccessPopup';
import { UserRoleContext } from '../components/layout/AuthLayout';
import { useTheme } from '@mui/material/styles';

const FlagType = {
  MATCH: 'Match',
  NO_MATCH: 'No match',
  RAISE: 'Raise',
  NO_FLAG: 'No flag',
};

const getFlagColor = (flag, theme) => {
  switch (flag) {
    case FlagType.MATCH:
      return { color: '#ffffff', bgcolor: theme.palette.success.main };
    case FlagType.NO_MATCH:
      return { color: '#ffffff', bgcolor: theme.palette.error.main };
    case FlagType.RAISE:
      return { color: '#ffffff', bgcolor: theme.palette.warning.main };
    case FlagType.NO_FLAG:
    default:
      return {
        color: theme.palette.text.secondary,
        bgcolor:
          theme.palette.mode === 'dark'
            ? theme.palette.grey[800]
            : theme.palette.grey[100],
      };
  }
};

const parsePageNumbers = (pageNumberStr) => {
  if (!pageNumberStr || pageNumberStr === 'Page No: NA') return [];
  const match = pageNumberStr.match(/Page No:\s*(.+)/i);
  if (!match) return [];
  return match[1]
    .split(',')
    .map((p) => p.trim())
    .filter((p) => p && !Number.isNaN(Number(p)))
    .map((p) => Number(p));
};

function ReportAnalysis({ reportId, prelim_folder, pdfUrl }) {
  console.log('ReportAnalysis props:', { reportId, prelim_folder, pdfUrl });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [analysisData, setAnalysisData] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const userRole = useContext(UserRoleContext);
  const theme = useTheme();

  // Treat the split-screen panel (~50vw) as narrow — md breakpoint catches it
  const isNarrow = useMediaQuery(theme.breakpoints.down('md'));

  const handlePageClick = (page) => {
    if (!pdfUrl) return;
    window.open(`${pdfUrl}#page=${page}`, '_blank', 'noopener,noreferrer');
  };

  useEffect(() => {
    const fetchAnalysisData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!reportId) throw new Error('Report ID is required');

        const response = await axiosInstance.get('/get_question_answer', {
          params: {
            report_id: reportId,
            ...(prelim_folder ? { prelim_folder } : {}),
          },
        });

        if (
          response.data.status === 'success' &&
          response.data.question_answer
        ) {
          const groupedData = response.data.question_answer.reduce(
            (acc, item) => {
              const headerKey = item.headerKey || 'Other';
              if (!acc[headerKey]) acc[headerKey] = [];
              acc[headerKey].push({
                ...item,
                originalDescriptionKey: item.descriptionKey,
                ...(item?.flag
                  ? { flag: item.flag, originalFlag: item.flag }
                  : {}),
              });
              return acc;
            },
            {}
          );

          setAnalysisData(
            Object.entries(groupedData).map(([header, items]) => ({
              category: header,
              items,
            }))
          );
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

      const updatedItems = analysisData.flatMap((section) =>
        section.items.map((item) => {
          const data = {
            headerKey: section.category,
            descriptionKey: item.descriptionKey,
            question: item.question,
            ...(item?.flag ? { flag: item.flag } : {}),
            ...(item?.record_updated
              ? { record_updated: item.record_updated }
              : {}),
          };
          if (
            item.descriptionKey !== item.originalDescriptionKey ||
            item.flag !== item.originalFlag
          ) {
            return { ...data, record_updated: true };
          }
          return data;
        })
      );

      if (updatedItems.length === 0) {
        setIsEditing(false);
        return;
      }

      await axiosInstance.post('/edit_question_answer', {
        report_id: reportId,
        updated_question_answer: updatedItems,
      });

      setAnalysisData((prevData) =>
        prevData.map((section) => ({
          ...section,
          items: section.items.map((item) => ({
            ...item,
            originalDescriptionKey: item.descriptionKey,
            ...(item?.flag ? { originalFlag: item.flag } : {}),
          })),
        }))
      );

      setIsEditing(false);
      setHasChanges(true);
      setShowSuccessPopup(true);
    } catch (error) {
      console.error('Error saving analysis data:', error);
      setError('Failed to save changes. Please try again.');
      handleCancel();
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setAnalysisData((prevData) =>
      prevData.map((section) => ({
        ...section,
        items: section.items.map((item) => ({
          ...item,
          descriptionKey: item.originalDescriptionKey,
          flag: item.originalFlag,
        })),
      }))
    );
    setIsEditing(false);
    setHasChanges(false);
  };

  const handleInputChange = (category, question, field, value) => {
    setAnalysisData((prevData) =>
      prevData.map((section) => {
        if (section.category !== category) return section;
        return {
          ...section,
          items: section.items.map((item) =>
            item.question === question ? { ...item, [field]: value } : item
          ),
        };
      })
    );
  };

  const handleDialogClose = () => setOpenDialog(false);
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
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Paper
        sx={{
          p: { xs: 1.5, sm: 2 },
          mb: 2,
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        {/* ── Header ── */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',   // always column so buttons never overflow
            gap: 1.5,
            mb: 2,
            flexShrink: 0,
          }}
        >
          {/* Title row */}
          <Box>
            <Typography variant="body2" color="text.secondary">
              Detailed analysis of the loss report based on key questions and
              findings
            </Typography>
          </Box>

          {/* Action buttons — wrap so they never overflow the panel */}
          {userRole !== 'Adjuster' && (
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 1,
                alignItems: 'center',
              }}
            >
              {isEditing && (
                <Button
                  variant="outlined"
                  color="error"
                  size={isNarrow ? 'small' : 'medium'}
                  onClick={handleCancel}
                  disabled={saving}
                >
                  Cancel
                </Button>
              )}

              <Button
                variant="contained"
                size={isNarrow ? 'small' : 'medium'}
                startIcon={isEditing ? <SaveIcon /> : <EditIcon />}
                onClick={isEditing ? handleSave : () => setIsEditing(true)}
                disabled={saving}
              >
                {isEditing ? (saving ? 'Saving...' : 'Save') : 'Edit'}
              </Button>

              <GenerateGuidanceReport
                reportId={reportId}
                hasAnalysisChanges={hasChanges}
                onError={setError}
              />
            </Box>
          )}
        </Box>

        {/* ── Scrollable accordion list ── */}
        <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
          {analysisData.map((section, index) => {
            const hasNoMatch = section.items.some(
              (item) => item.flag === FlagType.NO_MATCH
            );
            const hasRaiseFlag = section.items.some(
              (item) => item.flag === FlagType.RAISE
            );

            return (
              <Accordion key={index} sx={{ mb: 1, '&:before': { display: 'block !important', opacity: '1 !important' } }}>
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  aria-controls={`panel${index}-content`}
                  id={`panel${index}-header`}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      pr: 1,
                    }}
                  >
                    <Typography
                      fontWeight="medium"
                      sx={{ fontSize: { xs: '0.8125rem', sm: '0.875rem', md: '1rem' } }}
                    >
                      {section.category}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {hasNoMatch && (
                        <WarningIcon
                          sx={{ color: 'warning.main', fontSize: '1.2rem' }}
                        />
                      )}
                      {hasRaiseFlag && (
                        <FlagIcon
                          sx={{ color: 'success.main', fontSize: '1.2rem' }}
                        />
                      )}
                    </Box>
                  </Box>
                </AccordionSummary>

                <AccordionDetails sx={{ px: { xs: 1, sm: 2 } }}>
                  {section.items.map((item, itemIndex) => {
                    const pages = parsePageNumbers(item.pageNumber);

                    return (
                      <Box
                        key={itemIndex}
                        sx={{
                          mb: itemIndex !== section.items.length - 1 ? 3 : 0,
                          p: { xs: 1, sm: 2 },
                          bgcolor: 'background.default',
                          borderRadius: 1,
                        }}
                      >
                        {/* Question + flag chip */}
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            gap: 1,
                            mb: 1,
                            flexWrap: 'wrap', // chip wraps on narrow panels
                          }}
                        >
                          <Typography
                            variant="subtitle2"
                            color="primary"
                            sx={{
                              fontWeight: 'bold',
                              flex: 1,
                              fontSize: { xs: '0.75rem', sm: '0.875rem' },
                            }}
                          >
                            {item.question}
                          </Typography>

                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5,
                              flexShrink: 0,
                            }}
                          >
                            {item.flag === FlagType.RAISE && (
                              <FlagIcon
                                sx={{ color: 'success.main', fontSize: '1.2rem' }}
                              />
                            )}
                            {item.flag !== FlagType.NO_FLAG &&
                              item.flag !== FlagType.RAISE &&
                              item?.flag !== 'False' &&
                              item?.flag !== 'True' && (
                                <Chip
                                  label={item.flag}
                                  size="small"
                                  sx={{
                                    color: getFlagColor(item.flag, theme).color,
                                    bgcolor: getFlagColor(item.flag, theme).bgcolor,
                                    fontWeight: 500,
                                    fontSize: { xs: '0.65rem', sm: '0.75rem' },
                                    height: { xs: 20, sm: 24 },
                                  }}
                                />
                              )}
                          </Box>
                        </Box>

                        {/* Answer / edit field */}
                        {isEditing ? (
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
                            sx={{
                              mb: 2,
                              '& .MuiInputBase-root': {
                                fontSize: { xs: '0.8125rem', sm: '0.875rem' },
                              },
                            }}
                          />
                        ) : (
                          <>
                            <Typography
                              variant="body2"
                              sx={{
                                whiteSpace: 'pre-wrap',
                                mb: pages.length ? 0.5 : 1,
                                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                              }}
                            >
                              {item.descriptionKey}
                            </Typography>

                            {pages.length > 0 && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ display: 'block', mt: 1.25, mb: 1 }}
                              >
                                Page No:{' '}
                                {pages.map((page, idx) => (
                                  <span key={page}>
                                    <Typography
                                      variant="caption"
                                      component="span"
                                      onClick={
                                        pdfUrl
                                          ? () => handlePageClick(page)
                                          : undefined
                                      }
                                      sx={{
                                        cursor: pdfUrl ? 'pointer' : 'default',
                                        color: 'primary.main',
                                        ml: idx > 0 ? 0.5 : 0,
                                        '&:hover': pdfUrl
                                          ? { textDecoration: 'underline' }
                                          : {},
                                      }}
                                    >
                                      {page}
                                    </Typography>
                                    {idx < pages.length - 1 && ', '}
                                  </span>
                                ))}
                              </Typography>
                            )}
                          </>
                        )}
                      </Box>
                    );
                  })}
                </AccordionDetails>
              </Accordion>
            );
          })}
        </Box>
      </Paper>

      {/* Edit confirmation dialog */}
      <Dialog
        open={openDialog}
        onClose={handleDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 1 }}
        >
          <InfoIcon sx={{ color: 'warning.main' }} />
          <Typography variant="h6">Edit Information</Typography>
          <IconButton
            aria-label="close"
            onClick={handleDialogClose}
            sx={{ position: 'absolute', right: 8, top: 8 }}
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
        {userRole !== 'Adjuster' && (
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
        )}
      </Dialog>

      <SuccessPopup
        open={showSuccessPopup}
        onClose={() => setShowSuccessPopup(false)}
      />
    </Box>
  );
}

export default ReportAnalysis;