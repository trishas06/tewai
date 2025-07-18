import { useState, useEffect, useContext } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Alert,
  Tooltip,
  Divider,
  Chip,
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Add as AddIcon,
  KeyboardArrowUp as PromptUpIcon,
  KeyboardArrowDown as PromptDownIcon,
  Delete as DeleteIcon,
  QuestionAnswer as QuestionAnswerIcon,
} from '@mui/icons-material';
import axiosInstance from '../utils/axiosInstance';
import SuccessPopup from '../components/SuccessPopup';
import { UserRoleContext } from '../components/layout/AuthLayout';

function ChatbotPredefinedQuestions() {
  const [data, setData] = useState([]);
  const [backupData, setBackupData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [openQuestionDialog, setOpenQuestionDialog] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [newQuestionOrder, setNewQuestionOrder] = useState('');
  const [validationError, setValidationError] = useState('');
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const userRole = useContext(UserRoleContext);

  // Fetch questions data from API
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await axiosInstance.get('/get_default_chat');
        if (response.data.status === 'success' && response.data.chat_faq) {
          const sortedQuestions = response.data.chat_faq.sort(
            (a, b) => a.Order - b.Order
          );
          setData(sortedQuestions);
        } else {
          setError('Failed to load questions');
        }
      } catch (err) {
        console.error('Error fetching questions:', err);
        setError('Failed to load questions');
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, []);

  const handleEditClick = () => {
    setBackupData(JSON.parse(JSON.stringify(data)));
    setIsEditing(true);
    setValidationError('');
  };

  const handleSave = async () => {
    try {
      // Format data according to API structure
      const formattedData = {
        chat_faq: data.map((item) => ({
          question: item.question,
          Order: item.Order,
        })),
      };

      // Make API call to update predefined questions
      await axiosInstance.post('/update_default_chat', formattedData);

      // Clear backup as we're committing the changes
      setBackupData(null);
      setIsEditing(false);
      setValidationError('');
      setShowSuccessPopup(true);
    } catch (err) {
      setValidationError('Failed to save changes. Please try again.');
      console.error('Error saving predefined questions:', err);
    }
  };

  const handleCancel = () => {
    if (backupData) {
      setData(backupData);
      setBackupData(null);
    }
    setIsEditing(false);
    setValidationError('');
  };

  const handleAddQuestion = () => {
    setEditingQuestion(null);
    setNewQuestion('');
    setNewQuestionOrder('');
    setOpenQuestionDialog(true);
  };

  const handleEditQuestion = (question) => {
    setEditingQuestion(question);
    setNewQuestion(question.question);
    setNewQuestionOrder(question.Order.toString());
    setOpenQuestionDialog(true);
  };

  const handleQuestionDialogClose = () => {
    setOpenQuestionDialog(false);
    setNewQuestion('');
    setNewQuestionOrder('');
    setEditingQuestion(null);
  };

  const handleConfirmAddQuestion = () => {
    if (newQuestion.trim()) {
      const newOrder = parseInt(newQuestionOrder) || data.length + 1;
      const newData = [...data];

      if (editingQuestion) {
        // Update existing question
        const index = newData.findIndex(
          (q) => q.Order === editingQuestion.Order
        );
        if (index !== -1) {
          // Remove the question from its current position
          newData.splice(index, 1);

          // Create updated question with new order
          const updatedQuestion = {
            ...editingQuestion,
            question: newQuestion.trim(),
            Order: newOrder,
          };

          // Insert at new position
          if (newOrder <= 1) {
            newData.unshift(updatedQuestion);
          } else if (newOrder > newData.length) {
            newData.push(updatedQuestion);
          } else {
            newData.splice(newOrder - 1, 0, updatedQuestion);
          }
        }
      } else {
        // Create new question
        const newQuestionItem = {
          Order: newOrder,
          question: newQuestion.trim(),
        };

        // Insert at specific position or append
        if (newOrder <= 1) {
          newData.unshift(newQuestionItem);
        } else if (newOrder > newData.length) {
          newData.push(newQuestionItem);
        } else {
          newData.splice(newOrder - 1, 0, newQuestionItem);
        }
      }

      // Update orders for all questions
      newData.forEach((q, index) => {
        q.Order = index + 1;
      });

      setData(newData);
      handleQuestionDialogClose();
    }
  };

  const handleMoveQuestion = (questionIndex, direction) => {
    const newData = [...data];
    if (direction === 'up' && questionIndex > 0) {
      [newData[questionIndex], newData[questionIndex - 1]] = [
        newData[questionIndex - 1],
        newData[questionIndex],
      ];
      newData[questionIndex].Order = questionIndex + 1;
      newData[questionIndex - 1].Order = questionIndex;
    } else if (direction === 'down' && questionIndex < newData.length - 1) {
      [newData[questionIndex], newData[questionIndex + 1]] = [
        newData[questionIndex + 1],
        newData[questionIndex],
      ];
      newData[questionIndex].Order = questionIndex + 1;
      newData[questionIndex + 1].Order = questionIndex + 2;
    }
    setData(newData);
  };

  const handleDeleteQuestion = (questionIndex) => {
    const newData = [...data];
    newData.splice(questionIndex, 1);
    newData.forEach((q, index) => {
      q.Order = index + 1;
    });
    setData(newData);
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography>Loading questions...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
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
            <Typography variant="body2" color="text.secondary">
              Manage predefined questions for the chatbot
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {isEditing && userRole !== 'Adjuster' && (
              <Button variant="outlined" color="error" onClick={handleCancel}>
                Cancel
              </Button>
            )}
            {userRole !== 'Adjuster' && (
              <Button
                variant="contained"
                startIcon={isEditing ? <SaveIcon /> : <EditIcon />}
                onClick={isEditing ? handleSave : handleEditClick}
              >
                {isEditing ? 'Save' : 'Edit'}
              </Button>
            )}
            {isEditing && userRole !== 'Adjuster' && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAddQuestion}
                color="primary"
              >
                Add Question
              </Button>
            )}
          </Box>
        </Box>

        {validationError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {validationError}
          </Alert>
        )}

        <List>
          {data.map((question, index) => (
            <Box key={question.Order}>
              <ListItem
                sx={{
                  mb: 1,
                  bgcolor: 'background.default',
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                  '&:hover': {
                    bgcolor: 'action.hover',
                    borderColor: 'primary.main',
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                {isEditing && (
                  <Box
                    sx={{
                      display: 'flex',
                      gap: 1,
                      alignItems: 'center',
                      mr: 2,
                    }}
                  >
                    <Tooltip title={index === 0 ? '' : 'Move Up'}>
                      <span>
                        <IconButton
                          size="small"
                          disabled={index === 0}
                          onClick={() => handleMoveQuestion(index, 'up')}
                          sx={{
                            bgcolor:
                              index === 0
                                ? 'action.disabledBackground'
                                : 'primary.main',
                            width: 24,
                            height: 24,
                            '&:hover': {
                              bgcolor:
                                index === 0
                                  ? 'action.disabledBackground'
                                  : 'primary.dark',
                            },
                            '&.Mui-disabled': {
                              bgcolor: 'action.disabledBackground',
                            },
                          }}
                        >
                          <PromptUpIcon sx={{ fontSize: 16, color: 'white' }} />
                        </IconButton>
                      </span>
                    </Tooltip>

                    <Tooltip
                      title={index === data.length - 1 ? '' : 'Move Down'}
                    >
                      <span>
                        <IconButton
                          size="small"
                          disabled={index === data.length - 1}
                          onClick={() => handleMoveQuestion(index, 'down')}
                          sx={{
                            bgcolor:
                              index === data.length - 1
                                ? 'action.disabledBackground'
                                : 'primary.main',
                            width: 24,
                            height: 24,
                            '&:hover': {
                              bgcolor:
                                index === data.length - 1
                                  ? 'action.disabledBackground'
                                  : 'primary.dark',
                            },
                            '&.Mui-disabled': {
                              bgcolor: 'action.disabledBackground',
                            },
                          }}
                        >
                          <PromptDownIcon
                            sx={{ fontSize: 16, color: 'white' }}
                          />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Box>
                )}
                <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                  <QuestionAnswerIcon sx={{ mr: 2, color: 'primary.main' }} />
                  <ListItemText
                    primary={question.question}
                    primaryTypographyProps={{
                      variant: 'body1',
                      sx: { fontWeight: 500 },
                    }}
                  />
                </Box>
                {isEditing && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Tooltip title="Edit Question">
                      <IconButton
                        size="small"
                        onClick={() => handleEditQuestion(question)}
                        sx={{
                          color: 'primary.main',
                          '&:hover': {
                            bgcolor: 'primary.lighter',
                          },
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Question">
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteQuestion(index)}
                        sx={{
                          color: 'error.main',
                          '&:hover': {
                            bgcolor: 'error.lighter',
                          },
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                )}
              </ListItem>
              {index < data.length - 1 && <Divider sx={{ my: 1 }} />}
            </Box>
          ))}
        </List>
      </Paper>

      {/* Add/Edit Question Dialog */}
      <Dialog
        open={openQuestionDialog}
        onClose={handleQuestionDialogClose}
        PaperProps={{
          sx: { width: '100%', maxWidth: 500 },
        }}
      >
        <DialogTitle>
          {editingQuestion ? 'Edit Question' : 'Add New Question'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              autoFocus
              label="Question"
              fullWidth
              multiline
              rows={3}
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              label="Order"
              type="number"
              fullWidth
              value={newQuestionOrder}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '' || (parseInt(value) > 0 && !isNaN(value))) {
                  setNewQuestionOrder(value);
                }
              }}
              placeholder={`Enter order (1-${data.length + 1})`}
              sx={{ mb: 1 }}
              InputProps={{
                inputProps: { min: 1 },
              }}
              helperText="Leave empty to add at the end"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleQuestionDialogClose}>Cancel</Button>
          <Button
            onClick={handleConfirmAddQuestion}
            variant="contained"
            disabled={!newQuestion.trim()}
          >
            {editingQuestion ? 'Save Changes' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
      <SuccessPopup
        open={showSuccessPopup}
        onClose={() => setShowSuccessPopup(false)}
      />
    </Box>
  );
}

export default ChatbotPredefinedQuestions;
