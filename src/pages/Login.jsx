import { useState } from 'react';
import { Box, Container, Typography, Paper } from '@mui/material';
import authService from '../services/authService';
import LoginForm from '../components/LoginForm';
import DisclaimerEULA from '../components/DisclaimerEULA';

function Login() {
  const [error, setError] = useState('');
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);

  const handleDisclaimerAccept = () => {
    setDisclaimerAccepted(true);
  };

  const handleLogin = async (email, password) => {
    setError('');

    try {
      const userData = await authService.login(email, password);
      if (userData && userData.token) {
        // Force a full page reload to ensure all context is properly initialized
        window.location.href = '/dashboard';
      } else {
        throw new Error('Invalid user data received');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(
        error.message ||
          error.response?.data?.message ||
          'Failed to login. Please check your credentials.'
      );
    }
  };

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          mt: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {!disclaimerAccepted ? (
          <DisclaimerEULA 
            onAccept={handleDisclaimerAccept} 
            isAccepted={disclaimerAccepted} 
          />
        ) : (
          <Paper elevation={3} sx={{ p: 4, width: '100%', maxWidth: 500 }}>
            <Typography variant="h4" align="center" gutterBottom>
              Login
            </Typography>

            <LoginForm onSubmit={handleLogin} error={error} />
          </Paper>
        )}
      </Box>
    </Container>
  );
}

export default Login;
