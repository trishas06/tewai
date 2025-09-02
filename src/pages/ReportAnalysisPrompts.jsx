import { useState, useEffect, useContext } from 'react';
import {
  Box,
  Paper,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
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
  Switch,
  FormControlLabel,
  Fab,
  Alert,
  Tooltip,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  North as MoveUpIcon,
  South as MoveSouthIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Add as AddIcon,
  KeyboardArrowUp as PromptUpIcon,
  KeyboardArrowDown as PromptDownIcon,
  Delete as DeleteIcon,
  Info as InfoIcon,
  Close as CloseIcon,
  QuestionAnswer as QuestionAnswerIcon,
} from '@mui/icons-material';
import axiosInstance from '../utils/axiosInstance';
import SuccessPopup from '../components/SuccessPopup';
import { UserRoleContext } from '../components/layout/AuthLayout';

function ReportAnalysisPrompts() {
  const [data, setData] = useState([]);
  const [backupData, setBackupData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [openPromptDialog, setOpenPromptDialog] = useState(false);
  const [openCategoryDialog, setOpenCategoryDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [newPrompt, setNewPrompt] = useState('');
  const [newPromptOrder, setNewPromptOrder] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newCategoryOrder, setNewCategoryOrder] = useState('');
  const [validationError, setValidationError] = useState('');
  const [newlyAddedCategories, setNewlyAddedCategories] = useState(new Set());
  const [openInfoDialog, setOpenInfoDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingPrompt, setEditingPrompt] = useState(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const userRole = useContext(UserRoleContext);

  // Add this function at the top of the component
  const generateUniqueId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  // Fetch prompts data from API
  useEffect(() => {
    const fetchPrompts = async () => {
      try {
        const response = await axiosInstance.get('/get_prompts');
        // Map the response data to match our component's structure
        const formattedData = response.data.question_answer.map((item) => ({
          id: generateUniqueId(), // Generate unique id instead of using order
          category: item.category,
          enabled: item.questions.some((q) => q.is_enable), // Category is enabled if all questions are enabled
          order: item.order,
          prompts: item.questions.map((q) => ({
            id: generateUniqueId(), // Generate unique id for prompts too
            question: q.question,
            enabled: q.is_enable,
            order: q.order,
            type: q.type,
            execution_mode: q.execution_mode,
          })),
        }));
        setData(formattedData);
        setLoading(false);
      } catch {
        setError('Failed to load prompts. Please try again later.');
        setLoading(false);
      }
    };

    fetchPrompts();
  }, []);

  // Calculate if all items are enabled
  const isAllEnabled = data.every(
    (category) =>
      category.enabled && category.prompts.every((prompt) => prompt.enabled)
  );

  const handleToggleAll = () => {
    const newData = data.map((category) => ({
      ...category,
      enabled: !isAllEnabled,
      prompts: category.prompts.map((prompt) => ({
        ...prompt,
        enabled: !isAllEnabled,
      })),
    }));
    setData(newData);
  };

  const handleCategoryChange = (category) => (event, isExpanded) => {
    setExpandedCategory(isExpanded ? category : null);
  };

  const handleMoveCategory = (categoryIndex, direction) => {
    const newData = [...data];
    if (direction === 'up' && categoryIndex > 0) {
      // Swap categories
      [newData[categoryIndex], newData[categoryIndex - 1]] = [
        newData[categoryIndex - 1],
        newData[categoryIndex],
      ];
      // Update orders
      newData[categoryIndex].order = categoryIndex + 1;
      newData[categoryIndex - 1].order = categoryIndex;
    } else if (direction === 'down' && categoryIndex < newData.length - 1) {
      // Swap categories
      [newData[categoryIndex], newData[categoryIndex + 1]] = [
        newData[categoryIndex + 1],
        newData[categoryIndex],
      ];
      // Update orders
      newData[categoryIndex].order = categoryIndex + 1;
      newData[categoryIndex + 1].order = categoryIndex + 2;
    }
    setData(newData);
  };

  const handleToggleCategory = (categoryIndex) => {
    const newData = [...data];
    const category = newData[categoryIndex];
    const newEnabled = !category.enabled;
    category.enabled = newEnabled;
    // Toggle all prompts within the category
    category.prompts = category.prompts.map((prompt) => ({
      ...prompt,
      enabled: newEnabled,
    }));
    setData(newData);
  };

  const handleMovePrompt = (categoryIndex, promptIndex, direction) => {
    const newData = [...data];
    const category = newData[categoryIndex];
    const prompts = [...category.prompts];

    if (direction === 'up' && promptIndex > 0) {
      // Swap prompts
      [prompts[promptIndex], prompts[promptIndex - 1]] = [
        prompts[promptIndex - 1],
        prompts[promptIndex],
      ];
      // Update orders
      prompts[promptIndex].order = promptIndex + 1;
      prompts[promptIndex - 1].order = promptIndex;
    } else if (direction === 'down' && promptIndex < prompts.length - 1) {
      // Swap prompts
      [prompts[promptIndex], prompts[promptIndex + 1]] = [
        prompts[promptIndex + 1],
        prompts[promptIndex],
      ];
      // Update orders
      prompts[promptIndex].order = promptIndex + 1;
      prompts[promptIndex + 1].order = promptIndex + 2;
    }

    newData[categoryIndex] = { ...category, prompts };
    setData(newData);
  };

  const handleTogglePrompt = (categoryIndex, promptIndex) => {
    const newData = [...data];
    const category = newData[categoryIndex];
    const prompts = [...category.prompts];
    const newPromptEnabled = !prompts[promptIndex].enabled;

    prompts[promptIndex] = {
      ...prompts[promptIndex],
      enabled: newPromptEnabled,
    };

    // If category has only one prompt, toggle category status along with the prompt
    if (prompts.length === 1) {
      category.enabled = newPromptEnabled;
    } else {
      // For categories with multiple prompts, category is enabled only if any prompt is enabled
      category.enabled = prompts.some((prompt) => prompt.enabled);
    }

    newData[categoryIndex] = { ...category, prompts };
    setData(newData);
  };

  const handleEditClick = () => {
    // Create a deep copy of current data as backup
    setBackupData(JSON.parse(JSON.stringify(data)));
    setIsEditing(true);
    setValidationError('');
    setNewlyAddedCategories(new Set());
  };

  const handleSave = async () => {
    // Check if any newly added category has no prompts
    const categoriesWithNoPrompts = data
      .filter((category) => newlyAddedCategories.has(category.id))
      .filter((category) => category.prompts.length === 0)
      .map((category) => category.category);

    if (categoriesWithNoPrompts.length > 0) {
      setValidationError(
        `Please add at least one prompt to the following categories: ${categoriesWithNoPrompts.join(
          ', '
        )}`
      );
      return;
    }

    try {
      // Format data according to API structure
      const formattedData = {
        question_answer: data.map((category) => ({
          category: category.category,
          order: category.order,
          questions: category.prompts.map((prompt) => ({
            is_enable: prompt.enabled,
            order: prompt.order,
            question: prompt.question,
            execution_mode: prompt.execution_mode,
            type: prompt.type || 'text', // Use existing type or default to 'text'
          })),
        })),
      };

      // Make API call to update prompts
      await axiosInstance.post('/update_default_prompts', formattedData);

      // Clear backup as we're committing the changes
      setBackupData(null);
      setIsEditing(false);
      setValidationError('');
      setNewlyAddedCategories(new Set());
      setShowSuccessPopup(true);
    } catch (err) {
      setValidationError('Failed to save changes. Please try again.');
      console.error('Error saving prompts:', err);
    }
  };

  const handleCancel = () => {
    // Restore from backup
    if (backupData) {
      setData(backupData);
      setBackupData(null);
    }
    setIsEditing(false);
    setValidationError('');
    setNewlyAddedCategories(new Set());
    setExpandedCategory(null); // Close any open accordions
  };

  const handleAddPrompt = (category) => {
    setSelectedCategory(category);
    setOpenPromptDialog(true);
  };

  const handlePromptDialogClose = () => {
    setOpenPromptDialog(false);
    setNewPrompt('');
    setNewPromptOrder('');
    setSelectedCategory(null);
    setEditingPrompt(null);
  };

  const handleAddCategory = () => {
    setOpenCategoryDialog(true);
  };

  const handleCategoryDialogClose = () => {
    setOpenCategoryDialog(false);
    setNewCategory('');
    setNewCategoryOrder('');
    setEditingCategory(null);
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setNewCategory(category.category);
    setNewCategoryOrder(category.order.toString());
    setOpenCategoryDialog(true);
  };

  const handleEditPrompt = (category, prompt) => {
    setEditingPrompt(prompt);
    setSelectedCategory(category);
    setNewPrompt(prompt.question);
    setNewPromptOrder(prompt.order.toString());
    setOpenPromptDialog(true);
  };

  const handleConfirmAddCategory = () => {
    if (newCategory.trim()) {
      const newOrder = parseInt(newCategoryOrder) || data.length + 1;
      const newData = [...data];
      const newId = generateUniqueId();

      if (editingCategory) {
        // Update existing category
        const index = newData.findIndex((cat) => cat.id === editingCategory.id);
        if (index !== -1) {
          // Remove the category from its current position
          newData.splice(index, 1);

          // Create updated category with new order
          const updatedCategory = {
            ...editingCategory,
            category: newCategory.trim(),
            order: newOrder,
          };

          // Insert at new position
          if (newOrder <= 1) {
            newData.unshift(updatedCategory);
          } else if (newOrder > newData.length) {
            newData.push(updatedCategory);
          } else {
            newData.splice(newOrder - 1, 0, updatedCategory);
          }
        }
      } else {
        // Create new category
        const newCategoryItem = {
          id: newId,
          category: newCategory.trim(),
          enabled: true,
          order: newOrder,
          prompts: [],
        };

        // Insert at specific position or append
        if (newOrder <= 1) {
          newData.unshift(newCategoryItem);
        } else if (newOrder > newData.length) {
          newData.push(newCategoryItem);
        } else {
          newData.splice(newOrder - 1, 0, newCategoryItem);
        }
      }

      // Update orders for all categories
      newData.forEach((cat, index) => {
        cat.order = index + 1;
      });

      setData(newData);
      if (!editingCategory) {
        setNewlyAddedCategories((prev) => new Set([...prev, newId]));
      }
      handleCategoryDialogClose();
      setExpandedCategory(newCategory.trim());
      setEditingCategory(null);
    }
  };

  const handleConfirmAddPrompt = () => {
    if (newPrompt.trim() && selectedCategory) {
      const newData = data.map((category) => {
        if (category.category === selectedCategory) {
          const prompts = [...category.prompts];

          if (editingPrompt) {
            // Update existing prompt
            const index = prompts.findIndex((p) => p.id === editingPrompt.id);
            if (index !== -1) {
              // Remove the prompt from its current position
              prompts.splice(index, 1);

              // Create updated prompt with new order
              const updatedPrompt = {
                ...editingPrompt,
                question: newPrompt.trim(),
                order: parseInt(newPromptOrder) || prompts.length + 1,
              };

              // Insert at new position
              if (updatedPrompt.order <= 1) {
                prompts.unshift(updatedPrompt);
              } else if (updatedPrompt.order > prompts.length) {
                prompts.push(updatedPrompt);
              } else {
                prompts.splice(updatedPrompt.order - 1, 0, updatedPrompt);
              }
            }
          } else {
            // Create new prompt
            const newId = generateUniqueId();
            const newPromptItem = {
              id: newId,
              question: newPrompt.trim(),
              enabled: true,
              order: parseInt(newPromptOrder) || prompts.length + 1,
              type: 'text',
              execution_mode: 'sequential',
            };

            // Insert at specific position or append
            if (newPromptItem.order <= 1) {
              prompts.unshift(newPromptItem);
            } else if (newPromptItem.order > prompts.length) {
              prompts.push(newPromptItem);
            } else {
              prompts.splice(newPromptItem.order - 1, 0, newPromptItem);
            }
          }

          // Update orders for all prompts
          prompts.forEach((prompt, index) => {
            prompt.order = index + 1;
          });

          return { ...category, prompts };
        }
        return category;
      });
      setData(newData);
      handlePromptDialogClose();
      setEditingPrompt(null);
    }
  };

  const handleDeleteCategory = (categoryIndex, event) => {
    event.stopPropagation();
    const newData = [...data];
    newData.splice(categoryIndex, 1);

    // Update order for remaining categories
    newData.forEach((category, index) => {
      category.order = index + 1;
    });

    setData(newData);
    // If the deleted category was expanded, collapse it
    if (expandedCategory === data[categoryIndex].category) {
      setExpandedCategory(null);
    }
  };

  const handleDeletePrompt = (categoryIndex, promptIndex) => {
    const newData = [...data];
    const category = newData[categoryIndex];
    const prompts = [...category.prompts];
    prompts.splice(promptIndex, 1);

    // Update order for remaining prompts
    prompts.forEach((prompt, index) => {
      prompt.order = index + 1;
    });

    newData[categoryIndex] = { ...category, prompts };
    setData(newData);
  };

  const handleInfoDialogOpen = () => {
    setOpenInfoDialog(true);
  };

  const handleInfoDialogClose = () => {
    setOpenInfoDialog(false);
  };

  // Add loading and error states to the UI
  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography>Loading prompts...</Typography>
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
              Manage categories and prompts for the final loss report analysis
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {isEditing && userRole !== 'Adjuster' && (
              <>
                <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                  <Switch
                    checked={isAllEnabled}
                    onChange={handleToggleAll}
                    color="primary"
                  />
                  <IconButton
                    size="small"
                    onClick={handleInfoDialogOpen}
                    sx={{ ml: 0.5 }}
                  >
                    <InfoIcon fontSize="small" color="action" />
                  </IconButton>
                </Box>
                <Button variant="outlined" color="error" onClick={handleCancel}>
                  Cancel
                </Button>
              </>
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
                onClick={handleAddCategory}
                color="primary"
              >
                Add Category
              </Button>
            )}
          </Box>
        </Box>

        {validationError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {validationError}
          </Alert>
        )}

        {data.map((section, categoryIndex) => (
          <Accordion
            key={section.id}
            expanded={expandedCategory === section.category}
            onChange={handleCategoryChange(section.category)}
            sx={{
              mb: 1,
              opacity: section.enabled ? 1 : 0.6,
              transition: 'opacity 0.2s ease-in-out',
              ...(newlyAddedCategories.has(section.id) &&
                section.prompts.length === 0 && {
                  borderColor: 'error.main',
                  borderWidth: 1,
                  borderStyle: 'solid',
                }),
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls={`${section.category}-content`}
              id={`${section.category}-header`}
              sx={{
                '& .MuiAccordionSummary-content': {
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mr: 2,
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {isEditing && (
                  <Box
                    sx={{
                      display: 'flex',
                      gap: 1,
                      alignItems: 'center',
                    }}
                  >
                    <Tooltip title={categoryIndex === 0 ? '' : 'Move Up'}>
                      <span>
                        <IconButton
                          size="small"
                          disabled={categoryIndex === 0}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveCategory(categoryIndex, 'up');
                          }}
                          sx={{
                            bgcolor:
                              categoryIndex === 0
                                ? 'action.disabledBackground'
                                : 'primary.main',
                            width: 24,
                            height: 24,
                            '&:hover': {
                              bgcolor:
                                categoryIndex === 0
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
                      title={
                        categoryIndex === data.length - 1 ? '' : 'Move Down'
                      }
                    >
                      <span>
                        <IconButton
                          size="small"
                          disabled={categoryIndex === data.length - 1}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveCategory(categoryIndex, 'down');
                          }}
                          sx={{
                            bgcolor:
                              categoryIndex === data.length - 1
                                ? 'action.disabledBackground'
                                : 'primary.main',
                            width: 24,
                            height: 24,
                            '&:hover': {
                              bgcolor:
                                categoryIndex === data.length - 1
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
                <Typography
                  fontWeight="medium"
                  sx={{
                    color: !section.enabled ? 'text.disabled' : 'text.primary',
                  }}
                >
                  {section.category}
                </Typography>
              </Box>
              {isEditing && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Tooltip title="Edit Category">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditCategory(section);
                      }}
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
                  <Switch
                    checked={section.enabled}
                    onChange={() => handleToggleCategory(categoryIndex)}
                    onClick={(e) => e.stopPropagation()}
                    color="primary"
                  />
                  <Tooltip title="Delete Category">
                    <IconButton
                      size="small"
                      onClick={(e) => handleDeleteCategory(categoryIndex, e)}
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
            </AccordionSummary>
            <AccordionDetails>
              <List>
                {section.prompts.map((prompt, promptIndex) => (
                  <ListItem
                    key={prompt.id}
                    sx={{
                      mb: 1,
                      bgcolor: 'background.default',
                      borderRadius: 1,
                      opacity: prompt.enabled ? 1 : 0.6,
                      '&:hover': {
                        bgcolor: 'action.hover',
                      },
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
                        <Tooltip title={promptIndex === 0 ? '' : 'Move Up'}>
                          <span>
                            <IconButton
                              size="small"
                              disabled={promptIndex === 0}
                              onClick={() =>
                                handleMovePrompt(
                                  categoryIndex,
                                  promptIndex,
                                  'up'
                                )
                              }
                              sx={{
                                bgcolor:
                                  promptIndex === 0
                                    ? 'action.disabledBackground'
                                    : 'primary.main',
                                width: 24,
                                height: 24,
                                '&:hover': {
                                  bgcolor:
                                    promptIndex === 0
                                      ? 'action.disabledBackground'
                                      : 'primary.dark',
                                },
                                '&.Mui-disabled': {
                                  bgcolor: 'action.disabledBackground',
                                },
                              }}
                            >
                              <PromptUpIcon
                                sx={{ fontSize: 16, color: 'white' }}
                              />
                            </IconButton>
                          </span>
                        </Tooltip>

                        <Tooltip
                          title={
                            promptIndex === section.prompts.length - 1
                              ? ''
                              : 'Move Down'
                          }
                        >
                          <span>
                            <IconButton
                              size="small"
                              disabled={
                                promptIndex === section.prompts.length - 1
                              }
                              onClick={() =>
                                handleMovePrompt(
                                  categoryIndex,
                                  promptIndex,
                                  'down'
                                )
                              }
                              sx={{
                                bgcolor:
                                  promptIndex === section.prompts.length - 1
                                    ? 'action.disabledBackground'
                                    : 'primary.main',
                                width: 24,
                                height: 24,
                                '&:hover': {
                                  bgcolor:
                                    promptIndex === section.prompts.length - 1
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
                    <QuestionAnswerIcon sx={{ mr: 2, color: 'primary.main' }} />
                    <ListItemText
                      primary={prompt.question}
                      primaryTypographyProps={{
                        variant: 'body2',
                        color: prompt.enabled
                          ? 'text.primary'
                          : 'text.disabled',
                      }}
                    />
                    {isEditing && (
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        <Tooltip title="Edit Prompt">
                          <IconButton
                            size="small"
                            onClick={() =>
                              handleEditPrompt(section.category, prompt)
                            }
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
                        <Switch
                          checked={prompt.enabled}
                          onChange={() =>
                            handleTogglePrompt(categoryIndex, promptIndex)
                          }
                          color="primary"
                        />
                        <Tooltip title="Delete Prompt">
                          <IconButton
                            size="small"
                            onClick={() =>
                              handleDeletePrompt(categoryIndex, promptIndex)
                            }
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
                ))}
                {isEditing && (
                  <ListItem>
                    <Button
                      startIcon={<AddIcon />}
                      onClick={() => handleAddPrompt(section.category)}
                      fullWidth
                    >
                      Add New Prompt
                    </Button>
                  </ListItem>
                )}
              </List>
            </AccordionDetails>
          </Accordion>
        ))}
      </Paper>

      {/* Info Dialog */}
      <Dialog
        open={openInfoDialog}
        onClose={handleInfoDialogClose}
        PaperProps={{
          sx: {
            width: '100%',
            maxWidth: 600,
            borderRadius: 1,
            '& .MuiDialogTitle-root': {
              borderBottom: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.default',
            },
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <InfoIcon sx={{ color: '#FFB400' }} />
          Prompts
          <IconButton
            aria-label="close"
            onClick={handleInfoDialogClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: 'text.secondary',
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            This switch allows you to enable or disable all categories and their
            prompts at once:
          </Typography>
          <Box sx={{ pl: 2 }}>
            <Typography
              variant="body1"
              component="div"
              sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <span style={{ fontSize: '1.5em' }}>•</span> When turned ON:
              Enables all categories and their prompts
            </Typography>
            <Typography
              variant="body1"
              component="div"
              sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <span style={{ fontSize: '1.5em' }}>•</span> When turned OFF:
              Disabled in case all/any of categories and their prompts are
              disabled
            </Typography>
          </Box>
          <Typography
            variant="body1"
            sx={{ mt: 2, color: 'text.secondary', fontStyle: 'italic' }}
          >
            Note: You can still individually toggle categories and prompts after
            using this switch.
          </Typography>
        </DialogContent>
        <DialogActions
          sx={{
            p: 2,
            borderTop: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.default',
          }}
        >
          <Button
            onClick={handleInfoDialogClose}
            variant="contained"
            sx={{ minWidth: 100 }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add/Edit Category Dialog */}
      <Dialog
        open={openCategoryDialog}
        onClose={handleCategoryDialogClose}
        PaperProps={{
          sx: { width: '100%', maxWidth: 500 },
        }}
      >
        <DialogTitle>
          {editingCategory ? 'Edit Category' : 'Add New Category'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              autoFocus
              label="Category Name"
              fullWidth
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              label="Order"
              type="number"
              fullWidth
              value={newCategoryOrder}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '' || (parseInt(value) > 0 && !isNaN(value))) {
                  setNewCategoryOrder(value);
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
          <Button onClick={handleCategoryDialogClose}>Cancel</Button>
          <Button
            onClick={handleConfirmAddCategory}
            variant="contained"
            disabled={!newCategory.trim()}
          >
            {editingCategory ? 'Save Changes' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add/Edit Prompt Dialog */}
      <Dialog
        open={openPromptDialog}
        onClose={handlePromptDialogClose}
        PaperProps={{
          sx: { width: '100%', maxWidth: 500 },
        }}
      >
        <DialogTitle>
          {editingPrompt ? 'Edit Prompt' : 'Add New Prompt'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              autoFocus
              label="Prompt Question"
              fullWidth
              multiline
              rows={3}
              value={newPrompt}
              onChange={(e) => setNewPrompt(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              label="Order"
              type="number"
              fullWidth
              value={newPromptOrder}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '' || (parseInt(value) > 0 && !isNaN(value))) {
                  setNewPromptOrder(value);
                }
              }}
              placeholder={`Enter order (1-${
                selectedCategory
                  ? data.find((c) => c.category === selectedCategory)?.prompts
                      .length + 1 || 1
                  : 1
              })`}
              sx={{ mb: 1 }}
              InputProps={{
                inputProps: { min: 1 },
              }}
              helperText="Leave empty to add at the end"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handlePromptDialogClose}>Cancel</Button>
          <Button
            onClick={handleConfirmAddPrompt}
            variant="contained"
            disabled={!newPrompt.trim()}
          >
            {editingPrompt ? 'Save Changes' : 'Add'}
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

export default ReportAnalysisPrompts;
