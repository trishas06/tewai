import { useState } from 'react';
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
} from '@mui/icons-material';

// Dummy data structure
const initialData = [
  {
    id: 1,
    category: 'Property Details',
    enabled: true,
    prompts: [
      { id: 1, question: 'What is the property type?', enabled: true },
      { id: 2, question: 'What is the construction type?', enabled: true },
      { id: 3, question: 'What is the year built?', enabled: true },
    ],
  },
  {
    id: 2,
    category: 'Loss Information',
    enabled: true,
    prompts: [
      { id: 4, question: 'What is the date of loss?', enabled: true },
      { id: 5, question: 'What is the cause of loss?', enabled: true },
      { id: 6, question: 'What is the estimated damage amount?', enabled: true },
    ],
  },
  {
    id: 3,
    category: 'Coverage Details',
    enabled: true,
    prompts: [
      { id: 7, question: 'What is the policy number?', enabled: true },
      { id: 8, question: 'What is the coverage type?', enabled: true },
      { id: 9, question: 'What is the policy limit?', enabled: true },
    ],
  },
];

function AdminSettings() {
  const [data, setData] = useState(initialData);
  const [backupData, setBackupData] = useState(null);  // Backup for cancel operation
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

  // Calculate if all items are enabled
  const isAllEnabled = data.every(category => 
    category.enabled && category.prompts.every(prompt => prompt.enabled)
  );

  const handleToggleAll = () => {
    const newData = data.map(category => ({
      ...category,
      enabled: !isAllEnabled,
      prompts: category.prompts.map(prompt => ({
        ...prompt,
        enabled: !isAllEnabled
      }))
    }));
    setData(newData);
  };

  const handleCategoryChange = (category) => (event, isExpanded) => {
    setExpandedCategory(isExpanded ? category : null);
  };

  const handleMoveCategory = (categoryIndex, direction) => {
    const newData = [...data];
    if (direction === 'up' && categoryIndex > 0) {
      [newData[categoryIndex], newData[categoryIndex - 1]] = [newData[categoryIndex - 1], newData[categoryIndex]];
    } else if (direction === 'down' && categoryIndex < newData.length - 1) {
      [newData[categoryIndex], newData[categoryIndex + 1]] = [newData[categoryIndex + 1], newData[categoryIndex]];
    }
    setData(newData);
  };

  const handleToggleCategory = (categoryIndex) => {
    const newData = [...data];
    const category = newData[categoryIndex];
    category.enabled = !category.enabled;
    // Toggle all prompts within the category
    category.prompts = category.prompts.map(prompt => ({
      ...prompt,
      enabled: category.enabled
    }));
    setData(newData);
  };

  const handleMovePrompt = (categoryIndex, promptIndex, direction) => {
    const newData = [...data];
    const category = newData[categoryIndex];
    const prompts = [...category.prompts];
    
    if (direction === 'up' && promptIndex > 0) {
      [prompts[promptIndex], prompts[promptIndex - 1]] = [prompts[promptIndex - 1], prompts[promptIndex]];
    } else if (direction === 'down' && promptIndex < prompts.length - 1) {
      [prompts[promptIndex], prompts[promptIndex + 1]] = [prompts[promptIndex + 1], prompts[promptIndex]];
    }
    
    newData[categoryIndex] = { ...category, prompts };
    setData(newData);
  };

  const handleTogglePrompt = (categoryIndex, promptIndex) => {
    const newData = [...data];
    const category = newData[categoryIndex];
    const prompts = [...category.prompts];
    prompts[promptIndex] = {
      ...prompts[promptIndex],
      enabled: !prompts[promptIndex].enabled
    };
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

  const handleSave = () => {
    // Check if any newly added category has no prompts
    const categoriesWithNoPrompts = data
      .filter(category => newlyAddedCategories.has(category.id))
      .filter(category => category.prompts.length === 0)
      .map(category => category.category);

    if (categoriesWithNoPrompts.length > 0) {
      setValidationError(`Please add at least one prompt to the following categories: ${categoriesWithNoPrompts.join(', ')}`);
      return;
    }

    // Clear backup as we're committing the changes
    setBackupData(null);
    setIsEditing(false);
    setValidationError('');
    setNewlyAddedCategories(new Set());
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
    setExpandedCategory(null);  // Close any open accordions
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
  };

  const handleAddCategory = () => {
    setOpenCategoryDialog(true);
  };

  const handleCategoryDialogClose = () => {
    setOpenCategoryDialog(false);
    setNewCategory('');
    setNewCategoryOrder('');
  };

  const handleConfirmAddCategory = () => {
    if (newCategory.trim()) {
      const newId = Math.max(...data.map(c => c.id)) + 1;
      const newData = [...data];
      const orderNum = parseInt(newCategoryOrder) || newData.length + 1;
      
      // Create new category
      const newCategoryItem = {
        id: newId,
        category: newCategory.trim(),
        enabled: true,
        prompts: []
      };

      // Insert at specific position or append
      if (orderNum <= 1) {
        newData.unshift(newCategoryItem);
      } else if (orderNum > newData.length) {
        newData.push(newCategoryItem);
      } else {
        newData.splice(orderNum - 1, 0, newCategoryItem);
      }

      setData(newData);
      setNewlyAddedCategories(prev => new Set([...prev, newId]));
      handleCategoryDialogClose();
      setExpandedCategory(newCategory.trim());
    }
  };

  const handleConfirmAddPrompt = () => {
    if (newPrompt.trim() && selectedCategory) {
      const newData = data.map(category => {
        if (category.category === selectedCategory) {
          const prompts = [...category.prompts];
          const newId = Math.max(...prompts.map(p => p.id), 0) + 1;
          const orderNum = parseInt(newPromptOrder) || prompts.length + 1;
          
          // Create new prompt
          const newPromptItem = {
            id: newId,
            question: newPrompt.trim(),
            enabled: true
          };

          // Insert at specific position or append
          if (orderNum <= 1) {
            prompts.unshift(newPromptItem);
          } else if (orderNum > prompts.length) {
            prompts.push(newPromptItem);
          } else {
            prompts.splice(orderNum - 1, 0, newPromptItem);
          }

          return { ...category, prompts };
        }
        return category;
      });
      setData(newData);
      handlePromptDialogClose();
    }
  };

  const handleDeleteCategory = (categoryIndex, event) => {
    event.stopPropagation();
    const newData = [...data];
    newData.splice(categoryIndex, 1);
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
    newData[categoryIndex] = { ...category, prompts };
    setData(newData);
  };

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
              Admin Settings
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage categories and prompts for the loss report analysis
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {isEditing && (
              <>
                <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                    Toggle All
                  </Typography>
                  <Switch
                    checked={isAllEnabled}
                    onChange={handleToggleAll}
                    color="primary"
                  />
                </Box>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
              </>
            )}
            <Button
              variant="contained"
              startIcon={isEditing ? <SaveIcon /> : <EditIcon />}
              onClick={isEditing ? handleSave : handleEditClick}
            >
              {isEditing ? 'Save' : 'Edit'}
            </Button>
            {isEditing && (
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
              ...(newlyAddedCategories.has(section.id) && section.prompts.length === 0 && {
                borderColor: 'error.main',
                borderWidth: 1,
                borderStyle: 'solid'
              })
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
                  mr: 2
                }
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
                    {categoryIndex === 0 ? (
                      <IconButton
                        size="small"
                        disabled={true}
                        sx={{ 
                          bgcolor: 'action.disabledBackground',
                          width: 24,
                          height: 24,
                        }}
                      >
                        <PromptUpIcon sx={{ fontSize: 16, color: 'white' }} />
                      </IconButton>
                    ) : (
                      <Tooltip title="Move Up">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveCategory(categoryIndex, 'up');
                          }}
                          sx={{ 
                            bgcolor: 'primary.main',
                            width: 24,
                            height: 24,
                            '&:hover': {
                              bgcolor: 'primary.dark',
                            }
                          }}
                        >
                          <PromptUpIcon sx={{ fontSize: 16, color: 'white' }} />
                        </IconButton>
                      </Tooltip>
                    )}
                    {categoryIndex === data.length - 1 ? (
                      <IconButton
                        size="small"
                        disabled={true}
                        sx={{ 
                          bgcolor: 'action.disabledBackground',
                          width: 24,
                          height: 24,
                        }}
                      >
                        <PromptDownIcon sx={{ fontSize: 16, color: 'white' }} />
                      </IconButton>
                    ) : (
                      <Tooltip title="Move Down">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveCategory(categoryIndex, 'down');
                          }}
                          sx={{ 
                            bgcolor: 'primary.main',
                            width: 24,
                            height: 24,
                            '&:hover': {
                              bgcolor: 'primary.dark',
                            }
                          }}
                        >
                          <PromptDownIcon sx={{ fontSize: 16, color: 'white' }} />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                )}
                <Typography 
                  fontWeight="medium"
                  sx={{
                    color: !section.enabled ? 'text.disabled' : 'text.primary',
                    textDecoration: !section.enabled ? 'line-through' : 'none',
                  }}
                >
                  {section.category}
                </Typography>
              </Box>
              {isEditing && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
                        }
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
                          mr: 2
                        }}
                      >
                        {promptIndex === 0 ? (
                          <IconButton
                            size="small"
                            disabled={true}
                            sx={{ 
                              bgcolor: 'action.disabledBackground',
                              width: 24,
                              height: 24,
                            }}
                          >
                            <PromptUpIcon sx={{ fontSize: 16, color: 'white' }} />
                          </IconButton>
                        ) : (
                          <Tooltip title="Move Up">
                            <IconButton
                              size="small"
                              onClick={() => handleMovePrompt(categoryIndex, promptIndex, 'up')}
                              sx={{ 
                                bgcolor: 'primary.main',
                                width: 24,
                                height: 24,
                                '&:hover': {
                                  bgcolor: 'primary.dark',
                                }
                              }}
                            >
                              <PromptUpIcon sx={{ fontSize: 16, color: 'white' }} />
                            </IconButton>
                          </Tooltip>
                        )}
                        {promptIndex === section.prompts.length - 1 ? (
                          <IconButton
                            size="small"
                            disabled={true}
                            sx={{ 
                              bgcolor: 'action.disabledBackground',
                              width: 24,
                              height: 24,
                            }}
                          >
                            <PromptDownIcon sx={{ fontSize: 16, color: 'white' }} />
                          </IconButton>
                        ) : (
                          <Tooltip title="Move Down">
                            <IconButton
                              size="small"
                              onClick={() => handleMovePrompt(categoryIndex, promptIndex, 'down')}
                              sx={{ 
                                bgcolor: 'primary.main',
                                width: 24,
                                height: 24,
                                '&:hover': {
                                  bgcolor: 'primary.dark',
                                }
                              }}
                            >
                              <PromptDownIcon sx={{ fontSize: 16, color: 'white' }} />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    )}
                    <ListItemText
                      primary={prompt.question}
                      primaryTypographyProps={{
                        variant: 'body2',
                        color: prompt.enabled && section.enabled ? 'text.primary' : 'text.disabled',
                        textDecoration: prompt.enabled && section.enabled ? 'none' : 'line-through',
                      }}
                    />
                    {isEditing && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Switch
                          checked={prompt.enabled && section.enabled}
                          onChange={() => handleTogglePrompt(categoryIndex, promptIndex)}
                          color="primary"
                          disabled={!section.enabled}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <Tooltip title="Delete Prompt">
                          <IconButton
                            size="small"
                            onClick={() => handleDeletePrompt(categoryIndex, promptIndex)}
                            sx={{ 
                              color: 'error.main',
                              '&:hover': {
                                bgcolor: 'error.lighter',
                              }
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

      {/* Add Prompt Dialog */}
      <Dialog 
        open={openPromptDialog} 
        onClose={handlePromptDialogClose}
        PaperProps={{
          sx: { width: '100%', maxWidth: 500 }
        }}
      >
        <DialogTitle>Add New Prompt</DialogTitle>
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
              placeholder={`Enter order (1-${selectedCategory ? 
                data.find(c => c.category === selectedCategory)?.prompts.length + 1 || 1 
                : 1})`}
              sx={{ mb: 1 }}
              InputProps={{
                inputProps: { min: 1 }
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
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Category Dialog */}
      <Dialog 
        open={openCategoryDialog} 
        onClose={handleCategoryDialogClose}
        PaperProps={{
          sx: { width: '100%', maxWidth: 500 }
        }}
      >
        <DialogTitle>Add New Category</DialogTitle>
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
                inputProps: { min: 1 }
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
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default AdminSettings; 