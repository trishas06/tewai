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

// Status chip colors (matching Dashboard)
const getStatusColor = (status) => {
  switch (status) {
    case 'Failed':
      return { color: '#f44336', bgcolor: '#ffebee' };
    case 'Generated':
      return { color: '#1976d2', bgcolor: '#e3f2fd' };
    case 'Validated':
      return { color: '#4caf50', bgcolor: '#e8f5e9' };
    default:
      return { color: '#757575', bgcolor: '#f5f5f5' };
  }
};

function Notifications({ notifications, loading }) {
  const [notificationAnchorEl, setNotificationAnchorEl] = useState(null);

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
        title={notificationAnchorEl ? 'Close notifications' : 'Show notifications'}
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
                        color: getStatusColor(notification.status).color,
                        bgcolor: getStatusColor(notification.status).bgcolor,
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