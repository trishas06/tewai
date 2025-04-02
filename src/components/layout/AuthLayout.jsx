import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box } from '@mui/material';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import SessionTimeoutDialog from '../SessionTimeoutDialog';
import { SESSION_TIMEOUT_EVENT } from '../../utils/axiosInstance';
import dashboardService from '../../services/dashboardService';

function AuthLayout({ children }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSessionTimeout, setShowSessionTimeout] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
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

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const result = await dashboardService.getClaimsData(0, 1000, {}, '');
        const formattedNotifications = result.data
          .map((item) => {
            const date = new Date(item.createdOn);
            const today = new Date();
            const diffTime = Math.abs(today - date);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            let timeLabel = '';
            if (diffDays === 0) {
              timeLabel = 'Today';
            } else if (diffDays === 1) {
              timeLabel = 'Yesterday';
            } else if (diffDays < 7) {
              timeLabel = `${diffDays} days ago`;
            } else if (diffDays < 14) {
              timeLabel = '1 week ago';
            } else if (diffDays < 30) {
              const weeks = Math.floor(diffDays / 7);
              timeLabel = `${weeks} week${weeks > 1 ? 's' : ''} ago`;
            } else if (diffDays < 365) {
              const months = Math.floor(diffDays / 30);
              timeLabel = `${months} month${months > 1 ? 's' : ''} ago`;
            } else {
              const years = Math.floor(diffDays / 365);
              timeLabel = `${years} year${years > 1 ? 's' : ''} ago`;
            }

            return {
              id: item.claimNo,
              report_id: item.originalData.report_id,
              fileName: `${item.claimNo} - ${item.originalData.loss_report_name}`,
              status: item.status,
              timestamp: item.createdOn,
              time: new Date(item.createdOn).toLocaleString('en-US', {
                hour: 'numeric',
                minute: 'numeric',
                hour12: true,
                month: 'short',
                day: 'numeric',
              }),
              timeLabel
            };
          })
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        setNotifications(formattedNotifications);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setNotificationsLoading(false);
      }
    };

    fetchNotifications();
  }, []);

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
        <Header isExpanded={isExpanded} notifications={notifications} loading={notificationsLoading} />
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