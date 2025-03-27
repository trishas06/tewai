import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box } from '@mui/material';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';

function AuthLayout({ children }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  const handleSidebarToggle = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      minHeight: '100vh', 
      bgcolor: 'background.default',
      color: 'text.primary'
    }}>
      <Sidebar isExpanded={isExpanded} onToggle={handleSidebarToggle} />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          ml: '64px',
          pt: '64px', // Header height
          pb: '56px', // Footer height
          minHeight: '100vh',
          transition: theme => theme.transitions.create('margin-left', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.standard,
          }),
          bgcolor: 'background.default',
          color: 'text.primary'
        }}
      >
        <Header isExpanded={isExpanded} />
        {children}
        <Footer isExpanded={isExpanded} />
      </Box>
    </Box>
  );
}

export default AuthLayout; 