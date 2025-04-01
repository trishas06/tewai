import { useState } from 'react';
import {
  Box,
  Paper,
  TextField,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  InputAdornment,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';

// Dummy predefined questions
const PREDEFINED_QUESTIONS = [
  "What is the status of my claim?",
  "How long will the claim process take?",
  "What documents are required for the claim?",
  "Can I modify my claim after submission?",
  "How do I track my claim progress?",
  "What are the next steps in my claim?",
  "How can I appeal a claim decision?",
  "What is the coverage limit for my claim?",
  "How do I submit additional documentation?",
  "Can I speak with a claims adjuster?",
  "What is the deductible for my claim?",
  "How are claim payments processed?",
];

export default function PredefinedQuestions({ onQuestionSelect }) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter predefined questions based on search query
  const filteredQuestions = PREDEFINED_QUESTIONS.filter(q => 
    q.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Paper
      elevation={3}
      sx={{
        width: '40%',
        height: '100%',
        borderRadius: 2,
        mr: 2,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Typography
        variant="h6"
        sx={{
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          borderRadius: '8px 8px 0 0',
        }}
      >
        Predefined Questions
      </Typography>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search questions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>
      <List sx={{ overflow: 'auto', flex: 1 }}>
        {filteredQuestions.map((q, index) => (
          <ListItem key={index} disablePadding divider>
            <ListItemButton onClick={() => onQuestionSelect(q)}>
              <ListItemText 
                primary={q}
                primaryTypographyProps={{
                  sx: { 
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    lineHeight: 1.2,
                  }
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Paper>
  );
} 