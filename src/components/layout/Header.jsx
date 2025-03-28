import { useState, useEffect, useContext } from 'react';
import { Box, Avatar, Typography, IconButton, Tooltip, Badge, Menu, MenuItem, ListItemIcon, Divider, AppBar, Toolbar } from '@mui/material';
import { NotificationsOutlined as NotificationsIcon, Logout as LogoutIcon, Circle as CircleIcon, Brightness4 as Brightness4Icon, Brightness7 as Brightness7Icon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { ColorModeContext } from '../../App';
import { useTheme } from '@mui/material/styles';
import logo from '../../assets/images/logo.svg';

function Header({ isExpanded }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState(null);
  const [user, setUser] = useState(null);
  const [notifications] = useState([
    { 
      id: 1, 
      fileName: 'Dwelling Form - 0002938412',
      status: 'Failed',
      timestamp: '2025-03-26T12:57:00',
      time: '12:57 PM Today'
    },
    { 
      id: 2, 
      fileName: 'Dwelling Form - 0000102250',
      status: 'Generated',
      timestamp: '2025-03-25T20:14:00',
      time: '8:14 PM Yesterday'
    },
    { 
      id: 3, 
      fileName: 'Dwelling Form - 0002224016',
      status: 'Validated',
      timestamp: '2025-03-21T00:19:00',
      time: '12:19 AM Mar 21'
    }
  ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
  
  const navigate = useNavigate();
  const theme = useTheme();
  const colorMode = useContext(ColorModeContext);
  
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleOpenMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleToggleNotifications = (event) => {
    if (notificationAnchorEl) {
      setNotificationAnchorEl(null);
    } else {
      setNotificationAnchorEl(event.currentTarget);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return '';
    return name.split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Failed':
        return '#f44336';
      case 'Generated':
        return '#1976d2';
      case 'Validated':
        return '#4caf50';
      default:
        return '#757575';
    }
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        width: { sm: `calc(100% - ${isExpanded ? 240 : 64}px)` },
        ml: { sm: `${isExpanded ? 240 : 64}px` },
        transition: theme.transitions.create(['margin', 'width'], {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.leavingScreen,
        }),
        pr: 0,
        '& .MuiToolbar-root': {
          pr: 0,
          minHeight: '64px',
        }
      }}
    >
      <Toolbar sx={{ pr: 0 }}>
        <Box
          component="img"
          src={logo}
          alt="Logo"
          sx={{
            height: '40px',
            width: 'auto',
            mr: 1,
            filter: theme.palette.mode === 'dark' ? 'invert(1)' : 'none'
          }}
        />
        <Box sx={{ flexGrow: 1 }} />
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Tooltip title={theme.palette.mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
            <IconButton onClick={colorMode.toggleColorMode} color="inherit" sx={{ mr: 1 }}>
              {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
          </Tooltip>
          <Tooltip title={notificationAnchorEl ? "Close notifications" : "Show notifications"}>
            <IconButton 
              onClick={handleToggleNotifications}
              sx={{ 
                mr: 1,
                color: notificationAnchorEl ? 'primary.main' : 'text.secondary',
                transition: 'color 0.2s ease'
              }}
            >
              <Badge badgeContent={notifications.length} color="error">
                <NotificationsIcon />
              </Badge>
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
                  width: '360px',
                  maxHeight: '400px',
                  boxShadow: theme => theme.shadows[3],
                  bgcolor: 'background.paper',
                  '& .MuiMenuItem-root': {
                    py: 1.5,
                    px: 2
                  }
                }
              }
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            {notifications.map((notification) => (
              <MenuItem key={notification.id}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
                  <CircleIcon sx={{ fontSize: 8, color: getStatusColor(notification.status) }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {notification.fileName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {notification.time}
                    </Typography>
                  </Box>
                </Box>
              </MenuItem>
            ))}
          </Menu>

          <Box 
            onClick={handleOpenMenu}
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1.5,
              bgcolor: 'primary.main',
              color: 'white',
              py: 1,
              px: 2,
              borderRadius: 1,
              width: '200px',
              boxSizing: 'border-box',
              cursor: 'pointer',
              '&:hover': {
                bgcolor: 'primary.dark'
              },
              transition: 'background-color 0.2s ease'
            }}
          >
            <Avatar
              sx={{ 
                width: 32, 
                height: 32,
                bgcolor: 'secondary.main'
              }}
            >
              {user ? getInitials(user.name) : ''}
            </Avatar>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                {user ? user.name : 'Loading...'}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.9 }}>
                {user?.role || 'User'}
              </Typography>
            </Box>
          </Box>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleCloseMenu}
            onClick={handleCloseMenu}
            slotProps={{
              paper: {
                onClick: (e) => e.stopPropagation(),
                sx: {
                  mt: 0.5,
                  width: '200px',
                  boxShadow: theme => theme.shadows[3],
                  bgcolor: 'background.paper',
                  overflow: 'hidden',
                  '& .MuiMenuItem-root': {
                    px: 2,
                    py: 1.5
                  }
                }
              },
              list: {
                sx: { 
                  p: 0,
                  width: '100%'
                }
              }
            }}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right'
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right'
            }}
          >
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" sx={{ color: 'error.main' }} />
              </ListItemIcon>
              <Typography sx={{ color: 'error.main', flex: 1 }}>Logout</Typography>
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Header; 