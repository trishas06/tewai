import { useState } from 'react';
import { Box, Container, Typography, Paper } from '@mui/material';
import authService from '../services/authService';
import LoginForm from '../components/LoginForm';

function Login() {
  const [error, setError] = useState('');

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
            Login
          </Typography>

          <LoginForm onSubmit={handleLogin} error={error} />
        </Paper>
      </Box>
    </Container>
  );
}

export default Login;
