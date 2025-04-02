import { useState, useEffect, useContext } from 'react';
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
import { ColorModeContext } from '../../App';
import { useTheme } from '@mui/material/styles';
import logo from '../../assets/images/logo.svg';
import Notifications from '../Notifications';

function Header({ isExpanded, notifications, loading }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [user, setUser] = useState(null);

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

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return '';
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
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
              }}
            >
              {user ? getInitials(user.name) : ''}
            </Avatar>
            <Box>
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}
              >
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
