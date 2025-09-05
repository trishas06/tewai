import { useState, useContext } from 'react';
import {
  Box,
  Avatar,
  Typography,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  AppBar,
  Toolbar,
} from '@mui/material';
import {
  Logout as LogoutIcon,
  Brightness4 as Brightness4Icon,
  Brightness7 as Brightness7Icon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import logo from '../../assets/images/logo.svg';
import Notifications from '../Notifications';
import { useUser } from '../../contexts/UserContext';
import { ColorModeContext } from '../../contexts/ColorModeContext';

function Header({ isExpanded, notifications, loading }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const { user, clearUser } = useUser();

  const navigate = useNavigate();
  const theme = useTheme();
  const colorMode = useContext(ColorModeContext);

  const handleOpenMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    clearUser();
    navigate('/login');
  };

  const getInitials = (firstName, lastName) => {
    if (!firstName && !lastName) return '';
    const first = firstName ? firstName[0] : '';
    const last = lastName ? lastName[0] : '';
    return (first + last).toUpperCase();
  };

  const getDisplayName = (user) => {
    if (!user) return 'Loading...';
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    if (user.first_name) return user.first_name;
    if (user.last_name) return user.last_name;
    if (user.username) return user.username;
    return 'User';
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
        },
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
            filter: theme.palette.mode === 'dark' ? 'invert(1)' : 'none',
          }}
        />
        <Box sx={{ flexGrow: 1 }} />
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Tooltip
            title={
              theme.palette.mode === 'dark'
                ? 'Switch to light mode'
                : 'Switch to dark mode'
            }
          >
            <IconButton
              onClick={colorMode.toggleColorMode}
              color="inherit"
              sx={{ mr: 1 }}
            >
              {theme.palette.mode === 'dark' ? (
                <Brightness7Icon />
              ) : (
                <Brightness4Icon />
              )}
            </IconButton>
          </Tooltip>
          
          <Notifications notifications={notifications} loading={loading} />

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
                bgcolor: 'primary.dark',
              },
              transition: 'background-color 0.2s ease',
            }}
          >
            <Avatar
              sx={{
                width: 32,
                height: 32,
                bgcolor: 'secondary.main',
                color: 'white'
              }}
            >
              {user ? getInitials(user.first_name, user.last_name) : ''}
            </Avatar>
            <Box>
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}
              >
                {getDisplayName(user)}
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
                  boxShadow: (theme) => theme.shadows[3],
                  bgcolor: 'background.paper',
                  overflow: 'hidden',
                  '& .MuiMenuItem-root': {
                    px: 2,
                    py: 1.5,
                  },
                },
              },
              list: {
                sx: {
                  p: 0,
                  width: '100%',
                },
              },
            }}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" sx={{ color: 'error.main' }} />
              </ListItemIcon>
              <Typography sx={{ color: 'error.main', flex: 1 }}>
                Logout
              </Typography>
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Header;
