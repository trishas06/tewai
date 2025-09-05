import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  ArrowBack,
  CheckCircle,
} from '@mui/icons-material';
import authService from '../services/authService';
import {
  validatePasswordMatch,
  sanitizeInput,
} from '../utils/validation';

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [confirmValidation, setConfirmValidation] = useState({
    isValid: true,
    error: null,
  });
  const [token, setToken] = useState('');

  useEffect(() => {
    // Get the reset token from URL parameters
    const resetToken = searchParams.get('token');

    if (!resetToken) {
      setError('Invalid reset link. Please request a new password reset.');
      return;
    }

    setToken(resetToken);
  }, [searchParams]);

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    setError('');
    setPasswordError('');

    // Also validate confirm password if it exists
    if (confirmPassword) {
      const confirmValidation = validatePasswordMatch(value, confirmPassword);
      setConfirmValidation(confirmValidation);
    }
  };

  const handleConfirmPasswordChange = (e) => {
    const value = e.target.value;
    setConfirmPassword(value);
    setError('');

    // Real-time confirm password validation
    const validation = validatePasswordMatch(password, value);
    setConfirmValidation(validation);
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setPasswordError('');

    // Validate password is not empty
    if (!password.trim()) {
      setPasswordError('Password is required');
      return;
    }

    // Validate password match
    const confirmValidationResult = validatePasswordMatch(
      password,
      confirmPassword
    );
    if (!confirmValidationResult.isValid) {
      setConfirmValidation(confirmValidationResult);
      return;
    }

    if (!token) {
      setError('Invalid reset token. Please request a new password reset.');
      return;
    }

    setLoading(true);

    try {
      // Sanitize inputs before sending to API
      const sanitizedPassword = sanitizeInput(password);
      const email = searchParams.get('email');

      await authService.resetPassword(token, sanitizedPassword, email);
      setSuccess(true);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      console.error('Reset password error:', error);
      setError(
        error.message ||
          error.response?.data?.message ||
          'Failed to reset password. Please try again or request a new reset link.'
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
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <CheckCircle
                sx={{ fontSize: 60, color: 'success.main', mb: 2 }}
              />
              <Typography variant="h4" gutterBottom>
                Password Reset Successfully
              </Typography>
            </Box>

            <Alert severity="success" sx={{ mb: 3 }}>
              Your password has been reset successfully! You will be redirected
              to the login page shortly.
            </Alert>

            <Typography
              variant="body2"
              align="center"
              color="text.secondary"
              sx={{ mb: 3 }}
            >
              You can now log in with your new password.
            </Typography>

            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Button
                component={Link}
                to="/login"
                variant="contained"
                size="large"
              >
                Go to Login
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
            Reset Your Password
          </Typography>

          <Typography
            variant="body2"
            align="center"
            color="text.secondary"
            sx={{ mb: 3 }}
          >
            Please enter your new password below. Make sure it's secure and
            something you'll remember.
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
               name="password"
               label="New Password"
               type={showPassword ? 'text' : 'password'}
               id="password"
               autoComplete="new-password"
               value={password}
               onChange={handlePasswordChange}
               error={!!passwordError}
               helperText={passwordError}
               InputProps={{
                 endAdornment: (
                   <InputAdornment position="end">
                     <IconButton
                       aria-label="toggle password visibility"
                       onClick={() => setShowPassword(!showPassword)}
                       edge="end"
                     >
                       {showPassword ? <VisibilityOff /> : <Visibility />}
                     </IconButton>
                   </InputAdornment>
                 ),
               }}
             />

            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Confirm New Password"
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
              error={!confirmValidation.isValid}
              helperText={confirmValidation.error}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle confirm password visibility"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

              <Button
               type="submit"
               fullWidth
               variant="contained"
               sx={{ mt: 3, mb: 2 }}
               disabled={
                 loading ||
                 !!passwordError ||
                 !confirmValidation.isValid ||
                 !password ||
                 !confirmPassword
               }
             >
              {loading ? (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  Resetting Password...
                </Box>
              ) : (
                'Reset Password'
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

export default ResetPassword;
