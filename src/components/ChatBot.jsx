import { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import { io } from 'socket.io-client';
import axiosInstance from '../utils/axiosInstance';
import PredefinedQuestions from './PredefinedQuestions';
import ChatArea from './ChatArea';

export default function ChatBot({ reportId, userId, selectedfaq }) {
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState('');
  const [socket, setSocket] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [editingMessageIndex, setEditingMessageIndex] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [editingMessageContent, setEditingMessageContent] = useState('');
  const [editingPageReference, setEditingPageReference] = useState('');

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
            const chatArray = data.answer[timestamp];
            const answer = chatArray[1];
            const pageReference = chatArray[2] || '';
            addMessage('bot', answer, pageReference, timestamp);
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

  const generateMessageId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const addMessage = (role, content, pageReference = '', messageId = null) => {
    const date = new Date();
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const timestamp = messageId || `${days[date.getUTCDay()]} ${months[date.getUTCMonth()]} ${date.getUTCDate().toString().padStart(2, '0')} ${date.getUTCFullYear()} ${date.getUTCHours().toString().padStart(2, '0')}:${date.getUTCMinutes().toString().padStart(2, '0')}:${date.getUTCSeconds().toString().padStart(2, '0')}`;
    setMessages((prev) => [
      ...prev,
      {
        messageId: messageId || generateMessageId(),
        role,
        content,
        pageReference,
        timestamp
      },
    ]);
  };

  const loadChatHistory = async () => {
    try {
      const response = await axiosInstance.get('/get_chats', {
        params: { loss_report_id: reportId },
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
          timestamp
        });
        if (chatArray.length > 1) {
          const answer = chatArray[1];
          const pageReference = chatArray[2] || '';
          messages.push({
            messageId: timestamp,
            role: 'bot',
            content: answer,
            pageReference: pageReference,
            timestamp
          });
        }
      }
    }
    return messages;
  };

  const handleSendQuestion = (questionText = null) => {
    const textToSend = questionText || question;
    if (isLoading) return;
    if (!textToSend.trim()) {
      alert('Please type a message before sending.');
      return;
    }

    if (!reportId || !userId) {
      alert('Please provide both Loss Report ID and User ID.');
      return;
    }

    setIsLoading(true);
    addMessage('user', textToSend);

    if (socket) {
      socket.emit('ask_question', {
        loss_report_id: reportId,
        user_id: userId,
        question: textToSend,
        session_id: sessionId,
      });
    }
    setQuestion('');
  };

  const handleUpdateMessage = async (messageId) => {
    try {
      const allMessages = [...chatHistory, ...messages];
      
      // Find the user message that came before this bot message
      const botMessageIndex = allMessages.findIndex(msg => msg.messageId === messageId);
      const userMessage = allMessages[botMessageIndex - 1]; // User message is always right before bot message
      
      const updatedMessage = {
        loss_report_id: reportId,
        updated_chat: {
          [messageId]: [userMessage.content, editingMessageContent, editingPageReference],
        },
        messageId: messageId,
      };

      await axiosInstance.post('/edit_chat', updatedMessage);

      // Update the message in the UI
      const updateMessageInArray = (prev) =>
        prev.map((msg) =>
          msg.messageId === messageId
            ? { ...msg, content: editingMessageContent, pageReference: editingPageReference }
            : msg
        );

      setMessages(updateMessageInArray);
      setChatHistory(updateMessageInArray);
      setEditingMessageIndex(null);
      setEditingMessageContent('');
      setEditingPageReference('');
    } catch (error) {
      console.error('Error updating message:', error);
    }
  };

  return (
    <Box sx={{ display: 'flex', width: '100%', height: 'calc(100vh - 300px)' }}>
      <PredefinedQuestions onQuestionSelect={handleSendQuestion} />
      <ChatArea
        messages={messages}
        chatHistory={chatHistory}
        question={question}
        setQuestion={setQuestion}
        handleSendQuestion={handleSendQuestion}
        isLoading={isLoading}
        editingMessageIndex={editingMessageIndex}
        editingMessageContent={editingMessageContent}
        editingPageReference={editingPageReference}
        setEditingMessageIndex={setEditingMessageIndex}
        setEditingMessageContent={setEditingMessageContent}
        setEditingPageReference={setEditingPageReference}
        handleUpdateMessage={handleUpdateMessage}
      />
    </Box>
  );
}
