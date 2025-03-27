import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Paper } from '@mui/material';
import authService from '../services/authService';
import LoginForm from '../components/LoginForm';

function Login() {
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (email, password) => {
    setError('');
    
    try {
      await authService.login(email, password);
      navigate('/dashboard');
    } catch (error) {
      setError(
        error.response?.data?.message || 
        'Failed to login. Please check your credentials.'
      );
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
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