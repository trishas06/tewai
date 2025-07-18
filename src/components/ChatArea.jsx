import { useRef, useEffect, useContext } from 'react';
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Typography,
  Avatar,
  CircularProgress,
} from '@mui/material';
import {
  Send as SendIcon,
  Person as PersonIcon,
  SmartToy as SmartToyIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { UserRoleContext } from './layout/AuthLayout';

export default function ChatArea({
  messages,
  chatHistory,
  question,
  setQuestion,
  handleSendQuestion,
  isLoading,
  editingMessageIndex,
  editingMessageContent,
  editingPageReference,
  setEditingMessageIndex,
  setEditingMessageContent,
  setEditingPageReference,
  handleUpdateMessage,
}) {
  const scrollableDivRef = useRef(null);
  const userRole = useContext(UserRoleContext);

  // Auto scroll to bottom when messages change
  useEffect(() => {
    if (scrollableDivRef.current) {
      scrollableDivRef.current.scrollTop = scrollableDivRef.current.scrollHeight;
    }
  }, [messages, chatHistory, isLoading]);

  // Function to format timestamp to local timezone
  const formatTimestamp = (timestamp) => {
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date');
      }
      return date.toString().split('GMT')[0].trim();
    } catch (e) {
      console.error('Error parsing timestamp:', e);
      return 'Invalid date';
    }
  };

  return (
    <Paper
      elevation={3}
      sx={{
        width: '60%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
        maxWidth: '60%',
      }}
    >
      <Box
        ref={scrollableDivRef}
        sx={{
          flex: 1,
          overflowY: 'auto',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        {[...chatHistory, ...messages].length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              gap: 2,
              color: 'text.secondary',
            }}
          >
            <Typography variant="h6">
              Welcome to the Chat Assistant! 👋
            </Typography>
            <Typography variant="body1" textAlign="center">
              Start the conversation by typing your question below. I'm here to
              help you with your loss report queries.
            </Typography>
          </Box>
        ) : (
          [...chatHistory, ...messages].map((msg) => (
            <Box
              key={msg.messageId}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                width: '100%',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                  alignItems: 'flex-start',
                  gap: 1,
                  width: '100%',
                }}
              >
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor: msg.role === 'user' ? 'primary.main' : 'secondary.main',
                    border: 1,
                    borderColor: msg.role === 'user' ? 'primary.light' : 'secondary.light',
                  }}
                >
                  {msg.role === 'user' ? <PersonIcon /> : <SmartToyIcon />}
                </Avatar>
                <Paper
                  elevation={1}
                  sx={{
                    p: 1.5,
                    maxWidth: { xs: '85%', sm: '70%' },
                    bgcolor: msg.role === 'user' ? 'primary.light' : 'background.default',
                    color: msg.role === 'user' ? 'common.white' : 'text.primary',
                    borderRadius: 2,
                    position: 'relative',
                    '&:hover .edit-button': {
                      opacity: msg.role === 'bot' ? 1 : 0,
                    },
                  }}
                >
                  {editingMessageIndex === msg.messageId && msg.role === 'bot' ? (
                    <TextField
                      fullWidth
                      multiline
                      autoFocus
                      value={`${editingMessageContent}${editingPageReference ? `\n\n${editingPageReference}` : ''}`}
                      onChange={(e) => {
                        const text = e.target.value;
                        const parts = text.split('\n\n');
                        const content = parts[0];
                        const pageRef = parts.length > 1 ? parts[parts.length - 1] : '';
                        setEditingMessageContent(content);
                        setEditingPageReference(pageRef);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          handleUpdateMessage(msg.messageId);
                        } else if (e.key === 'Escape') {
                          setEditingMessageIndex(null);
                          setEditingMessageContent('');
                          setEditingPageReference('');
                        }
                      }}
                      onBlur={() => {
                        setEditingMessageIndex(null);
                        setEditingMessageContent('');
                        setEditingPageReference('');
                      }}
                      variant="outlined"
                      size="small"
                    />
                  ) : (
                    <Box sx={{ position: 'relative', pr: 3 }}>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                        {msg.content}
                        {msg.pageReference && (
                          <Typography
                            component="span"
                            sx={{
                              display: 'block',
                              mt: 0.5,
                              color: 'text.secondary',
                              fontStyle: 'italic',
                              fontSize: '0.875rem'
                            }}
                          >
                            {msg.pageReference}
                          </Typography>
                        )}
                      </Typography>
                      {msg.role === 'bot' && userRole !== 'Adjuster' && (
                        <IconButton
                          className="edit-button"
                          size="small"
                          onClick={() => {
                            setEditingMessageIndex(msg.messageId);
                            setEditingMessageContent(msg.content);
                            setEditingPageReference(msg.pageReference || '');
                          }}
                          sx={{
                            position: 'absolute',
                            right: -28,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            opacity: 0,
                            transition: 'opacity 0.2s',
                            color: 'action.active',
                            '&:hover': {
                              bgcolor: 'action.hover',
                            },
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  )}
                </Paper>
              </Box>
              <Typography
                variant="caption"
                sx={{
                  color: theme => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
                  fontSize: '0.75rem',
                  mt: 0.5,
                  mx: 6,
                  fontStyle: 'italic',
                  opacity: 0.8
                }}
              >
                {formatTimestamp(msg.timestamp)}
              </Typography>
            </Box>
          ))
        )}
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CircularProgress size={24} />
          </Box>
        )}
      </Box>
      <Box
        sx={{
          p: 2,
          borderTop: 1,
          borderColor: 'divider',
          display: 'flex',
          gap: 1,
          width: '100%',
        }}
      >
        <TextField
          fullWidth
          size="small"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendQuestion();
            }
          }}
          placeholder="Type your message..."
          variant="outlined"
        />
        <IconButton
          color="primary"
          onClick={() => handleSendQuestion()}
          disabled={isLoading}
        >
          <SendIcon />
        </IconButton>
      </Box>
    </Paper>
  );
} 