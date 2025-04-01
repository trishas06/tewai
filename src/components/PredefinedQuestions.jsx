import { useState, useEffect } from 'react';
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
  CircularProgress,
  useTheme,
} from '@mui/material';
import {
  Search as SearchIcon,
  QuestionAnswer as QuestionAnswerIcon,
} from '@mui/icons-material';
import axiosInstance from '../utils/axiosInstance';

export default function PredefinedQuestions({ onQuestionSelect }) {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await axiosInstance.get('/get_default_chat');
        if (response.data.status === 'success' && response.data.chat_faq) {
          const sortedQuestions = response.data.chat_faq.sort(
            (a, b) => a.Order - b.Order
          );
          setQuestions(sortedQuestions);
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

  const filteredQuestions = questions.filter((q) =>
    q.question.toLowerCase().includes(searchQuery.toLowerCase())
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
        overflow: 'hidden',
      }}
    >
      <Typography
        variant="h6"
        sx={{
          p: 2.5,
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          borderRadius: '8px 8px 0 0',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        Predefined Questions
        <Typography variant="body2" sx={{ opacity: 0.9 }}>
          {filteredQuestions.length} Questions
        </Typography>
      </Typography>
      <Box
        sx={{
          p: 2.5,
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: theme.palette.background.paper,
        }}
      >
        <TextField
          fullWidth
          size="small"
          placeholder="Search questions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              '&:hover': {
                bgcolor: theme.palette.action.hover,
              },
              '&.Mui-focused': {
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: theme.palette.primary.main,
                  borderWidth: 2,
                },
              },
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
        />
      </Box>
      <List
        sx={{
          overflow: 'auto',
          flex: 1,
          position: 'relative',
          py: 0,
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: theme.palette.background.paper,
          },
          '&::-webkit-scrollbar-thumb': {
            background: theme.palette.primary.main + '40',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: theme.palette.primary.main + '60',
          },
        }}
      >
        {loading ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
              minHeight: 200,
            }}
          >
            <CircularProgress size={32} />
          </Box>
        ) : error ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
              color: 'error.main',
              minHeight: 200,
            }}
          >
            <Typography>{error}</Typography>
          </Box>
        ) : (
          filteredQuestions.map((q, index) => (
            <Box key={q.Order} sx={{ display: 'flex', alignItems: 'stretch' }}>
              <QuestionAnswerIcon 
                sx={{ 
                  color: 'primary.main',
                  alignSelf: 'center',
                  ml: 2.5
                }} 
              />
              <ListItem
                disablePadding
                sx={{
                  borderBottom:
                    index !== filteredQuestions.length - 1
                      ? `1px solid ${theme.palette.divider}`
                      : 'none',
                  flex: 1,
                }}
              >
                <ListItemButton
                  onClick={() => onQuestionSelect(q.question)}
                  sx={{
                    py: 2,
                    px: 2.5,
                    '&:hover': {
                      bgcolor: theme.palette.primary.light + '20',
                    },
                    '&.Mui-selected': {
                      bgcolor: theme.palette.primary.light + '40',
                      '&:hover': {
                        bgcolor: theme.palette.primary.light + '50',
                      },
                    },
                  }}
                >
                  <ListItemText
                    primary={q.question}
                    primaryTypographyProps={{
                      sx: {
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        lineHeight: 1.4,
                        color: theme.palette.text.primary,
                        fontSize: '0.95rem',
                        fontWeight: 400,
                      },
                    }}
                  />
                </ListItemButton>
              </ListItem>
            </Box>
          ))
        )}
      </List>
    </Paper>
  );
}
