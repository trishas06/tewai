import { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Typography,
  Avatar,
  CircularProgress,
} from '@mui/material';
import { Send as SendIcon, Person as PersonIcon, SmartToy as SmartToyIcon } from '@mui/icons-material';
import { io } from 'socket.io-client';
import axiosInstance from '../utils/axiosInstance';

export default function ChatBot({ reportId, userId, selectedfaq }) {
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState('');
  const [socket, setSocket] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [editingMessageIndex, setEditingMessageIndex] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [editingMessageContent, setEditingMessageContent] = useState('');
  const scrollableDivRef = useRef(null);

  useEffect(() => {
    const newSocket = io(import.meta.env.VITE_API_BASE_URL);
    newSocket.on('connect', () => {
      console.log('Connected to WebSocket server');
    });

    newSocket.on('response', (data) => {
      console.log('Received data:', data);
      setIsLoading(false);

      if (data.error) {
        addMessage('bot', `Error: ${data.error}`);
      } else if (data.answer) {
        for (const timestamp in data.answer) {
          if (Object.prototype.hasOwnProperty.call(data.answer, timestamp)) {
            const combinedMessages = data.answer[timestamp].slice(1).join(', ');
            addMessage('bot', combinedMessages);
          }
        }
      }
    });

    setSocket(newSocket);
    setQuestion(selectedfaq || '');
    loadChatHistory();

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [selectedfaq]);

  useEffect(() => {
    if (scrollableDivRef.current) {
      scrollableDivRef.current.scrollTop =
        scrollableDivRef.current.scrollHeight;
    }
  }, [messages, chatHistory]);

  const generateMessageId = () => {
    return new Date().toISOString();
  };

  const addMessage = (role, content) => {
    setMessages((prev) => [
      ...prev,
      {
        messageId: generateMessageId(),
        role,
        content,
      },
    ]);
  };

  const loadChatHistory = async () => {
    try {
      const response = await axiosInstance.get('/get_chats', {
        params: { loss_report_id: reportId }
      });

      const { session_id, chats } = response.data;
      const chatHistory = convertChatsToMessages(chats);
      const newSessionId =
        Array.isArray(chats) && chats.length === 0 ? '' : session_id;
      setSessionId(newSessionId);
      setChatHistory(chatHistory);
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const convertChatsToMessages = (chats) => {
    const messages = [];
    for (const timestamp in chats) {
      if (timestamp !== 'content') {
        const chatArray = chats[timestamp];
        messages.push({
          messageId: generateMessageId(),
          role: 'user',
          content: chatArray[0],
        });
        if (chatArray.length > 1) {
          const combinedMessages = chatArray.slice(1).join(', ');
          messages.push({
            messageId: timestamp,
            role: 'bot',
            content: combinedMessages,
          });
        }
      }
    }
    return messages;
  };

  const handleSendQuestion = () => {
    if (isLoading) return;
    if (!question.trim()) {
      alert('Please type a message before sending.');
      return;
    }

    if (!reportId || !userId) {
      alert('Please provide both Loss Report ID and User ID.');
      return;
    }

    setIsLoading(true);
    addMessage('user', question);

    if (socket) {
      socket.emit('ask_question', {
        loss_report_id: reportId,
        user_id: userId,
        question: question,
        session_id: sessionId,
      });
    }
    setQuestion('');
  };

  const handleUpdateMessage = async (messageId) => {
    try {
      const updatedMessage = {
        loss_report_id: reportId,
        updated_chat: {
          [messageId]: [question, editingMessageContent, 'Page No: []'],
        },
        messageId: messageId,
      };

      await axiosInstance.post('/edit_chat', updatedMessage);

      // Update the message in the UI
      setMessages((prev) =>
        prev.map((msg) =>
          msg.messageId === messageId
            ? { ...msg, content: editingMessageContent }
            : msg
        )
      );
      setChatHistory((prev) =>
        prev.map((msg) =>
          msg.messageId === messageId
            ? { ...msg, content: editingMessageContent }
            : msg
        )
      );
      setEditingMessageIndex(null);
      setEditingMessageContent('');
    } catch (error) {
      console.error('Error updating message:', error);
    }
  };

  return (
    <Paper
      elevation={3}
      sx={{
        height: 'calc(100vh - 300px)',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
        maxWidth: '100%',
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
              Start the conversation by typing your question below.
              I'm here to help you with your loss report queries.
            </Typography>
          </Box>
        ) : (
          [...chatHistory, ...messages].map((msg) => (
            <Box
              key={msg.messageId}
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
                }}
              >
                {editingMessageIndex === msg.messageId ? (
                  <TextField
                    fullWidth
                    multiline
                    value={editingMessageContent}
                    onChange={(e) => setEditingMessageContent(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        handleUpdateMessage(msg.messageId);
                      }
                    }}
                    variant="outlined"
                    size="small"
                  />
                ) : (
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                    {msg.content}
                  </Typography>
                )}
              </Paper>
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
          onClick={handleSendQuestion}
          disabled={isLoading}
        >
          <SendIcon />
        </IconButton>
      </Box>
    </Paper>
  );
}
