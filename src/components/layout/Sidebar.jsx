import { Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Tooltip, IconButton } from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Description as DescriptionIcon,
  Assessment as AssessmentIcon,
  Settings as SettingsIcon,
  MenuOpen as MenuOpenIcon,
  Menu as MenuIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const drawerWidth = 240;
const collapsedWidth = 64;

const menuItems = [
  { text: 'Dashboard', icon: <DescriptionIcon />, path: '/dashboard' },
  { text: 'Admin Settings', icon: <AdminPanelSettingsIcon />, path: '/admin-settings' },
  // { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  // { text: 'Loss Reports', icon: <DescriptionIcon />, path: '/loss-reports' },
  // { text: 'Analytics', icon: <AssessmentIcon />, path: '/analytics' },
  // { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
];

function Sidebar({ isExpanded, onToggle }) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: isExpanded ? drawerWidth : collapsedWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: isExpanded ? drawerWidth : collapsedWidth,
          boxSizing: 'border-box',
          bgcolor: 'background.paper',
          borderRight: 1,
          borderColor: 'divider',
          transition: theme => theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.standard,
          }),
        },
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'flex-end',
        p: 1,
        borderBottom: 1,
        borderColor: 'divider'
      }}>
        <Tooltip title={isExpanded ? "Collapse Sidebar" : "Expand Sidebar"}>
          <IconButton onClick={onToggle} color="primary">
            {isExpanded ? <MenuOpenIcon /> : <MenuIcon />}
          </IconButton>
        </Tooltip>
      </Box>
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              onClick={() => navigate(item.path)}
              selected={location.pathname === item.path}
              sx={{
                minHeight: 48,
                justifyContent: isExpanded ? 'initial' : 'center',
                px: 2.5,
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'white',
                  },
                },
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: isExpanded ? 3 : 'auto',
                  justifyContent: 'center',
                  color: 'text.secondary',
                }}
              >
                {item.icon}
              </ListItemIcon>
              {isExpanded && (
                <ListItemText 
                  primary={item.text}
                  primaryTypographyProps={{
                    color: 'text.primary',
                    variant: 'body2',
                    fontWeight: location.pathname === item.path ? 600 : 400
                  }}
                />
              )}
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
}

export default Sidebar; 