import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box } from '@mui/material';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import SessionTimeoutDialog from '../SessionTimeoutDialog';
import { SESSION_TIMEOUT_EVENT } from '../../utils/axiosInstance';

function AuthLayout({ children }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSessionTimeout, setShowSessionTimeout] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    }

    // Listen for session timeout events
    const handleSessionTimeout = () => {
      setShowSessionTimeout(true);
    };

    window.addEventListener(SESSION_TIMEOUT_EVENT, handleSessionTimeout);

    return () => {
      window.removeEventListener(SESSION_TIMEOUT_EVENT, handleSessionTimeout);
    };
  }, [navigate]);

  const handleSidebarToggle = () => {
    setIsExpanded(!isExpanded);
  };

  const handleSessionTimeoutClose = () => {
    setShowSessionTimeout(false);
    navigate('/login');
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
          ml: '24px',
          pt: '64px', // Header height
          pb: '56px', // Footer height
          pr: '24px',
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

      <SessionTimeoutDialog
        open={showSessionTimeout}
        onClose={handleSessionTimeoutClose}
      />
    </Box>
  );
}

export default AuthLayout; 