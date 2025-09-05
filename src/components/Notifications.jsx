import { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  Chip,
} from '@mui/material';
import { NotificationsOutlined as NotificationsIcon } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

// Status chip colors (matching Dashboard) - consistent solid backgrounds with white text for all modes
const getStatusColor = (status, theme) => {
  switch (status) {
    case 'Failed':
    case 'Corrupted File':
    case 'Empty PDF':
    case 'Password Protected':
    case 'Invalid File Format':
    case 'File Not Found':
    case 'Validation Failed':
      return { 
        color: '#ffffff',
        bgcolor: theme.palette.error.main 
      };
    case 'Generated':
      return { 
        color: '#ffffff',
        bgcolor: theme.palette.primary.main 
      };
    case 'Validated':
      return { 
        color: '#ffffff',
        bgcolor: theme.palette.success.main 
      };
    case 'Missing Prelim Document':
    case 'Unsearchable PDF':
      return { 
        color: '#ffffff',
        bgcolor: theme.palette.warning.main 
      };
    default:
      return { 
        color: theme.palette.text.secondary, 
        bgcolor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[100] 
      };
  }
};

function Notifications({ notifications, loading }) {
  const [notificationAnchorEl, setNotificationAnchorEl] = useState(null);
  const theme = useTheme();

  const handleToggleNotifications = (event) => {
    if (notificationAnchorEl) {
      setNotificationAnchorEl(null);
    } else {
      setNotificationAnchorEl(event.currentTarget);
    }
  };

  return (
    <>
      <Tooltip
        title={
          notificationAnchorEl ? 'Close notifications' : 'Show notifications'
        }
      >
        <IconButton
          onClick={handleToggleNotifications}
          sx={{
            mr: 1,
            color: notificationAnchorEl ? 'primary.main' : 'text.secondary',
            transition: 'color 0.2s ease',
          }}
        >
          <NotificationsIcon />
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={notificationAnchorEl}
        open={Boolean(notificationAnchorEl)}
        onClose={() => setNotificationAnchorEl(null)}
        slotProps={{
          paper: {
            sx: {
              mt: 1.5,
              width: '500px',
              maxHeight: '400px',
              boxShadow: (theme) => theme.shadows[3],
              bgcolor: 'background.paper',
              '& .MuiMenuItem-root': {
                py: 1.5,
                px: 2,
              },
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {loading ? (
          <MenuItem disabled>
            <Typography>Loading notifications...</Typography>
          </MenuItem>
        ) : notifications.length === 0 ? (
          <MenuItem disabled>
            <Typography>No notifications</Typography>
          </MenuItem>
        ) : (
          <Box sx={{ maxHeight: '300px', overflow: 'auto' }}>
            {notifications.map((notification) => (
              <MenuItem key={notification.report_id}>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0.5,
                    width: '100%',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {notification.fileName}
                    </Typography>
                    <Chip
                      label={notification.status}
                      size="small"
                                          sx={{
                      color: getStatusColor(notification.status, theme).color,
                      bgcolor: getStatusColor(notification.status, theme).bgcolor,
                      fontWeight: 500,
                      height: 20,
                      '& .MuiChip-label': {
                        px: 1,
                        fontSize: '0.75rem',
                      },
                    }}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {notification.timeLabel && (
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'primary.main',
                          fontWeight: 500,
                        }}
                      >
                        {notification.timeLabel}
                      </Typography>
                    )}
                    <Typography variant="caption" color="text.secondary">
                      {notification.time}
                    </Typography>
                  </Box>
                </Box>
              </MenuItem>
            ))}
          </Box>
        )}
      </Menu>
    </>
  );
}

export default Notifications;
