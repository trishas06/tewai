import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Menu,
  MenuItem,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress
} from '@mui/material';
import {
  Edit as EditIcon,
  Cancel as CancelIcon,
  Save as SaveIcon,
  MoreVert as MoreIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
  Delete as DeleteIcon,
  Check as CheckIcon,
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';
import axios from 'axios';

function ReportSummary({ reportId = '67dc62ec5163b4b362573679' }) {
  // State for summary editing
  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [summary, setSummary] = useState('');
  const [originalSummary, setOriginalSummary] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for categories and descriptions
  const [categories, setCategories] = useState([]);

  // State for prompts dialog
  const [isPromptsDialogOpen, setIsPromptsDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');

  // State for category menu
  const [categoryMenuAnchor, setCategoryMenuAnchor] = useState(null);
  const [selectedCategoryForMenu, setSelectedCategoryForMenu] = useState(null);

  // State for guidance report dialog
  const [isGuidanceDialogOpen, setIsGuidanceDialogOpen] = useState(false);
  const [applyToAllReports, setApplyToAllReports] = useState(false);

  // Fetch summary and question answers
  useEffect(() => {
    const fetchSummaryData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication token not found');
        }

        const response = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/get_summary`, 
          {
            params: { report_id: reportId },
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );

        // Update summary and categories from the response
        const { summary: reportSummary, question_answer: questionAnswers } = response.data;
        setSummary(reportSummary || '');
        setOriginalSummary(reportSummary || '');
        
        // Transform question_answer data to match our structure
        const categoryMap = new Map();
        
        questionAnswers.forEach(qa => {
          const headerKey = qa.headerKey || 'Uncategorized';
          if (!categoryMap.has(headerKey)) {
            categoryMap.set(headerKey, {
              id: qa.id || Math.random().toString(36).substr(2, 9),
              name: headerKey,
              descriptions: []
            });
          }
          categoryMap.get(headerKey).descriptions.push(qa.descriptionKey);
        });

        const formattedCategories = Array.from(categoryMap.values());
        setCategories(formattedCategories);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching summary data:', error);
        setError(error.message === 'Authentication token not found' 
          ? 'Please log in to view the summary.' 
          : 'Failed to load summary data. Please try again.');
        setLoading(false);
      }
    };

    fetchSummaryData();
  }, [reportId]);

  // Handlers for summary editing
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

  // Handlers for prompts dialog
  const handleOpenPromptsDialog = () => {
    setIsPromptsDialogOpen(true);
  };

  const handleClosePromptsDialog = () => {
    setIsPromptsDialogOpen(false);
    setSelectedCategory(null);
    setEditingCategoryId(null);
    setIsAddingCategory(false);
    setIsAddingQuestion(false);
  };

  const handleCategoryMenuOpen = (event, category) => {
    setCategoryMenuAnchor(event.currentTarget);
    setSelectedCategoryForMenu(category);
  };

  const handleCategoryMenuClose = () => {
    setCategoryMenuAnchor(null);
    setSelectedCategoryForMenu(null);
  };

  const handleEditCategory = () => {
    setEditingCategoryId(selectedCategoryForMenu.id);
    setNewCategoryName(selectedCategoryForMenu.name);
    handleCategoryMenuClose();
  };

  const handleSaveCategory = async () => {
    try {
      // TODO: API call to save category
      setEditingCategoryId(null);
      setNewCategoryName('');
    } catch (error) {
      console.error('Error saving category:', error);
    }
  };

  const handleDeleteCategory = async () => {
    try {
      // TODO: API call to delete category
      handleCategoryMenuClose();
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  // Handlers for guidance report
  const handleOpenGuidanceDialog = () => {
    setIsGuidanceDialogOpen(true);
  };

  const handleCloseGuidanceDialog = () => {
    setIsGuidanceDialogOpen(false);
    setApplyToAllReports(false);
  };

  const handleGenerateGuidanceReport = async () => {
    try {
      // TODO: API call to generate guidance report
      handleCloseGuidanceDialog();
    } catch (error) {
      console.error('Error generating guidance report:', error);
    }
  };

  return (
    <Box>
      {error ? (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography color="error" align="center">{error}</Typography>
        </Paper>
      ) : loading ? (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <CircularProgress />
          </Box>
        </Paper>
      ) : (
        <>
          {/* Summary Section */}
          <Paper sx={{ p: 2, mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">Report Summary</Typography>
              <Button
                startIcon={isEditingSummary ? <SaveIcon /> : <EditIcon />}
                onClick={isEditingSummary ? handleSaveSummary : handleEditSummary}
              >
                {isEditingSummary ? 'Save' : 'Edit'}
              </Button>
            </Box>
            <TextField
              fullWidth
              multiline
              rows={4}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              disabled={!isEditingSummary}
              sx={{
                '& .MuiInputBase-input.Mui-disabled': {
                  WebkitTextFillColor: 'rgba(0, 0, 0, 0.87)',
                  color: 'text.primary'
                }
              }}
            />
            {isEditingSummary && (
              <IconButton 
                onClick={handleCancelSummary}
                sx={{ mt: 1 }}
              >
                <CancelIcon />
              </IconButton>
            )}
          </Paper>

          {/* Categories and Descriptions */}
          {categories.length > 0 && (
            <Paper sx={{ p: 2, mb: 2 }}>
              <Box sx={{ mt: 2 }}>
                {categories.map((category) => (
                  <Accordion key={category.id} sx={{ mb: 1 }}>
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon />}
                      aria-controls={`category-${category.id}-content`}
                      id={`category-${category.id}-header`}
                      sx={{
                        '&.Mui-expanded': {
                          minHeight: 48,
                          borderBottom: '1px solid rgba(0, 0, 0, 0.12)'
                        }
                      }}
                    >
                      <Typography variant="subtitle1">{category.name}</Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ pt: 2 }}>
                      {category.descriptions.map((description, index) => (
                        <TextField
                          key={index}
                          fullWidth
                          multiline
                          value={description}
                          disabled
                          sx={{ 
                            mb: index < category.descriptions.length - 1 ? 2 : 0,
                            '& .MuiInputBase-input.Mui-disabled': {
                              WebkitTextFillColor: 'rgba(0, 0, 0, 0.87)',
                              color: 'text.primary'
                            }
                          }}
                        />
                      ))}
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Box>
            </Paper>
          )}

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant="contained" onClick={handleOpenPromptsDialog}>
              Edit Prompts
            </Button>
            <Button variant="contained" onClick={handleOpenGuidanceDialog}>
              Generate Guidance Report
            </Button>
          </Box>

          {/* Prompts Dialog */}
          <Dialog 
            open={isPromptsDialogOpen} 
            onClose={handleClosePromptsDialog}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle>Edit Prompts</DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'flex', gap: 2 }}>
                {/* Categories List */}
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6">Categories</Typography>
                    <Button
                      startIcon={<AddIcon />}
                      onClick={() => setIsAddingCategory(true)}
                    >
                      Add Category
                    </Button>
                  </Box>
                  <List>
                    {categories.map((category) => (
                      <ListItem key={category.id}>
                        {editingCategoryId === category.id ? (
                          <>
                            <TextField
                              value={newCategoryName}
                              onChange={(e) => setNewCategoryName(e.target.value)}
                              size="small"
                              fullWidth
                            />
                            <IconButton onClick={handleSaveCategory}>
                              <CheckIcon color="success" />
                            </IconButton>
                          </>
                        ) : (
                          <>
                            <ListItemText primary={category.name} />
                            <ListItemSecondaryAction>
                              <IconButton onClick={(e) => handleCategoryMenuOpen(e, category)}>
                                <MoreIcon />
                              </IconButton>
                              <IconButton>
                                <ArrowUpIcon />
                              </IconButton>
                              <IconButton>
                                <ArrowDownIcon />
                              </IconButton>
                            </ListItemSecondaryAction>
                          </>
                        )}
                      </ListItem>
                    ))}
                  </List>
                </Box>

                <Divider orientation="vertical" flexItem />

                {/* Questions List */}
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6">Questions</Typography>
                    <Button
                      startIcon={<AddIcon />}
                      onClick={() => setIsAddingQuestion(true)}
                      disabled={!selectedCategory}
                    >
                      Add Question
                    </Button>
                  </Box>
                  {selectedCategory && (
                    <List>
                      {/* Questions will be rendered here */}
                    </List>
                  )}
                </Box>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleClosePromptsDialog}>Cancel</Button>
              <Button variant="contained" onClick={handleClosePromptsDialog}>
                Save
              </Button>
            </DialogActions>
          </Dialog>

          {/* Category Menu */}
          <Menu
            anchorEl={categoryMenuAnchor}
            open={Boolean(categoryMenuAnchor)}
            onClose={handleCategoryMenuClose}
          >
            <MenuItem onClick={handleEditCategory}>
              <EditIcon sx={{ mr: 1 }} /> Edit
            </MenuItem>
            <MenuItem onClick={handleDeleteCategory}>
              <DeleteIcon sx={{ mr: 1 }} /> Delete
            </MenuItem>
          </Menu>

          {/* Guidance Report Dialog */}
          <Dialog
            open={isGuidanceDialogOpen}
            onClose={handleCloseGuidanceDialog}
          >
            <DialogTitle>Generate Guidance Report</DialogTitle>
            <DialogContent>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={applyToAllReports}
                    onChange={(e) => setApplyToAllReports(e.target.checked)}
                  />
                }
                label="Apply changes to all incoming reports"
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseGuidanceDialog}>Cancel</Button>
              <Button variant="contained" onClick={handleGenerateGuidanceReport}>
                Confirm
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}
    </Box>
  );
}

export default ReportSummary; 