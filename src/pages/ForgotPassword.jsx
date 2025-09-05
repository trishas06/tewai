import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  Alert,
  CircularProgress
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import authService from '../services/authService';
import { validateUsernameOrEmail, sanitizeInput } from '../utils/validation';

function ForgotPassword() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [validationError, setValidationError] = useState('');

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInput(value);
    setError('');
    setValidationError('');

    // Real-time validation
    if (value) {
      const validation = validateUsernameOrEmail(value);
      if (!validation.isValid) {
        setValidationError(validation.error);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setValidationError('');

    // Validate input
    const validation = validateUsernameOrEmail(input);
    if (!validation.isValid) {
      setValidationError(validation.error);
      return;
    }

    setLoading(true);

    try {
      // Sanitize input before sending to API
      const sanitizedInput = sanitizeInput(input);
      
      await authService.forgotPassword(sanitizedInput);
      setSuccess(true);
    } catch (error) {
      console.error('Forgot password error:', error);
      setError(
        error.message ||
        error.response?.data?.message ||
        'Failed to process forgot password request. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Container maxWidth="sm">
        <Box
          sx={{
            mt: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
            <Typography variant="h4" align="center" gutterBottom>
              Check Your Email
            </Typography>
            
            <Alert severity="success" sx={{ mb: 3 }}>
              We've sent a password reset link to your email address. Please check your inbox and follow the instructions to reset your password.
            </Alert>

            <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 3 }}>
              Didn't receive the email? Check your spam folder or try again with a different email address.
            </Typography>

            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
              <Button
                component={Link}
                to="/login"
                variant="contained"
                startIcon={<ArrowBack />}
              >
                Back to Login
              </Button>
              <Button
                variant="outlined"
                onClick={() => {
                  setSuccess(false);
                  setInput('');
                }}
              >
                Try Again
              </Button>
            </Box>
          </Paper>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          mt: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography variant="h4" align="center" gutterBottom>
            Forgot Password
          </Typography>

          <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 3 }}>
            Enter your username or email address and we'll send you a link to reset your password.
          </Typography>

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <TextField
              margin="normal"
              required
              fullWidth
              id="usernameOrEmail"
              label="Username or Email"
              name="usernameOrEmail"
              autoComplete="username email"
              autoFocus
              value={input}
              onChange={handleInputChange}
              error={!!validationError}
              helperText={validationError}
              placeholder="Enter your username or email address"
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading || !!validationError}
            >
              {loading ? (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  Sending Reset Link...
                </Box>
              ) : (
                'Send Reset Link'
              )}
            </Button>

            <Box sx={{ textAlign: 'center' }}>
              <Button
                component={Link}
                to="/login"
                variant="text"
                color="primary"
                sx={{ textTransform: 'none' }}
                startIcon={<ArrowBack />}
              >
                Back to Login
              </Button>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}

export default ForgotPassword;
