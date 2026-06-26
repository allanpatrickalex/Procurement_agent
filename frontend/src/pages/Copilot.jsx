import React, { useRef, useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Stack,
  Divider,
  Chip,
} from '@mui/material';
import {
  AutoAwesome as CopilotIcon,
  Send as SendIcon,
  Person as UserIcon,
  SmartToy as BotIcon,
} from '@mui/icons-material';
import { sendChatMessage } from '../services/api';

const STARTER_QUESTIONS = [
  'How much have we spent in total across all analyses?',
  'Which contracts are coming up for renewal?',
  'What are our biggest savings opportunities?',
  'Which supplier scored the highest in recent quotes?',
];

function Message({ role, content }) {
  const isUser = role === 'user';
  return (
    <Box
      sx={{
        display: 'flex',
        gap: 1.5,
        flexDirection: isUser ? 'row-reverse' : 'row',
        alignItems: 'flex-start',
      }}
    >
      <Box
        sx={{
          width: 32,
          height: 32,
          borderRadius: '8px',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isUser ? 'primary.light' : '#F1F5F9',
        }}
      >
        {isUser
          ? <UserIcon sx={{ fontSize: 16, color: 'primary.main' }} />
          : <BotIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
        }
      </Box>
      <Box
        sx={{
          maxWidth: '80%',
          px: 2,
          py: 1.5,
          borderRadius: isUser ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
          backgroundColor: isUser ? 'primary.main' : 'background.paper',
          border: isUser ? 'none' : '1px solid',
          borderColor: 'divider',
          color: isUser ? 'white' : 'text.primary',
        }}
      >
        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
          {content}
        </Typography>
      </Box>
    </Box>
  );
}

function Copilot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    const messageText = text || input.trim();
    if (!messageText) return;

    setInput('');
    setError(null);
    const newMessages = [...messages, { role: 'user', content: messageText }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      const response = await sendChatMessage(messageText, history);
      setMessages([...newMessages, { role: 'assistant', content: response.reply }]);
    } catch (err) {
      setError(err.message);
      // Remove the optimistic user message on error
      setMessages(messages);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      <Box sx={{ mb: 5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <Box sx={{ width: 36, height: 36, borderRadius: '10px', background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CopilotIcon sx={{ color: 'white', fontSize: 20 }} />
          </Box>
          <Typography variant="h4">Procurement Copilot</Typography>
        </Box>
        <Typography variant="body1" color="text.secondary" sx={{ ml: 6.5 }}>
          Ask questions across all your procurement data — spend, contracts, suppliers, and savings.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card sx={{ display: 'flex', flexDirection: 'column', height: '65vh' }}>
        {/* Message area */}
        <Box sx={{ flex: 1, overflowY: 'auto', p: 3 }}>
          {messages.length === 0 ? (
            <Box sx={{ textAlign: 'center', pt: 6 }}>
              <Box sx={{ width: 64, height: 64, borderRadius: '16px', background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
                <CopilotIcon sx={{ color: 'white', fontSize: 30 }} />
              </Box>
              <Typography variant="h6" gutterBottom>Ask me anything about your procurement data</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                I have access to all your supplier analyses, contract reviews, spend reports, and savings.
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="center" useFlexGap>
                {STARTER_QUESTIONS.map((q) => (
                  <Chip
                    key={q}
                    label={q}
                    onClick={() => sendMessage(q)}
                    sx={{ cursor: 'pointer', mb: 1 }}
                    variant="outlined"
                  />
                ))}
              </Stack>
            </Box>
          ) : (
            <Stack spacing={2.5}>
              {messages.map((msg, i) => (
                <Message key={i} role={msg.role} content={msg.content} />
              ))}
              {loading && (
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                  <Box sx={{ width: 32, height: 32, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F1F5F9' }}>
                    <BotIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  </Box>
                  <Box sx={{ px: 2, py: 1.5, borderRadius: '12px 12px 12px 2px', border: '1px solid', borderColor: 'divider', backgroundColor: 'background.paper' }}>
                    <CircularProgress size={16} />
                  </Box>
                </Box>
              )}
              <div ref={bottomRef} />
            </Stack>
          )}
        </Box>

        <Divider />

        {/* Input area */}
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <TextField
              fullWidth
              multiline
              maxRows={4}
              placeholder="Ask about your spend, contracts, savings…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            />
            <Button
              variant="contained"
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              sx={{ px: 2.5, minWidth: 'unset', borderRadius: '10px' }}
            >
              <SendIcon fontSize="small" />
            </Button>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Press Enter to send · Shift+Enter for new line
          </Typography>
        </Box>
      </Card>
    </Container>
  );
}

export default Copilot;
