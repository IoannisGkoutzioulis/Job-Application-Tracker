import React from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Analytics as AnalyticsIcon,
  Assessment as AssessmentIcon,
  // ... other icons ...
} from '@mui/icons-material';

const Sidebar = () => {
  const drawerWidth = 240;
  const location = useLocation();

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          mt: 8, // to account for the navbar height
        },
      }}
    >
      <List>
        <ListItem 
          button 
          component={RouterLink} 
          to="/"
          selected={location.pathname === '/'}
        >
          <ListItemIcon>
            <DashboardIcon />
          </ListItemIcon>
          <ListItemText primary="Dashboard" />
        </ListItem>

        <Divider />

        <ListItem 
          button 
          component={RouterLink} 
          to="/analytics"
          selected={location.pathname === '/analytics'}
        >
          <ListItemIcon>
            <AnalyticsIcon />
          </ListItemIcon>
          <ListItemText primary="Analytics Overview" />
        </ListItem>

        <ListItem 
          button 
          component={RouterLink} 
          to="/analytics/detailed"
          selected={location.pathname === '/analytics/detailed'}
        >
          <ListItemIcon>
            <AssessmentIcon />
          </ListItemIcon>
          <ListItemText primary="Detailed Statistics" />
        </ListItem>

        {/* ... other navigation items ... */}
      </List>
    </Drawer>
  );
};

export default Sidebar; 