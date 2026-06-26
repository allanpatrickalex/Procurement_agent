import React, { useEffect, useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
  Container,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  useMediaQuery,
  Badge,
  Menu,
  MenuItem,
  Tooltip,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Dashboard as DashboardIcon,
  LocalShipping as SupplierIcon,
  Description as ContractIcon,
  TrendingDown as SpendIcon,
  Menu as MenuIcon,
  Inventory2 as LogoIcon,
  Close as CloseIcon,
  Savings as SavingsIcon,
  EventRepeat as RenewalIcon,
  AutoAwesome as CopilotIcon,
  Handshake as SourcingIcon,
  Notifications as NotificationsIcon,
  AccountCircle as AccountIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { getNotifications, markAllNotificationsRead } from '../services/api';

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/', icon: <DashboardIcon fontSize="small" /> },
  { label: 'Suppliers', path: '/suppliers', icon: <SupplierIcon fontSize="small" /> },
  { label: 'Contracts', path: '/contracts', icon: <ContractIcon fontSize="small" /> },
  { label: 'Spend', path: '/spend', icon: <SpendIcon fontSize="small" /> },
  { label: 'Savings', path: '/savings', icon: <SavingsIcon fontSize="small" /> },
  { label: 'Renewals', path: '/renewals', icon: <RenewalIcon fontSize="small" /> },
  { label: 'Copilot', path: '/copilot', icon: <CopilotIcon fontSize="small" /> },
  { label: 'Sourcing', path: '/sourcing', icon: <SourcingIcon fontSize="small" /> },
];

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user, logout } = useAuth();

  const [notifCount, setNotifCount] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifAnchor, setNotifAnchor] = useState(null);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!user) return;
    const fetchNotifs = async () => {
      try {
        const data = await getNotifications(true);
        setNotifCount(data.length);
        setNotifications(data.slice(0, 5));
      } catch {
        // ignore
      }
    };
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 60000);
    return () => clearInterval(interval);
  }, [user]);

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifCount(0);
      setNotifications([]);
    } catch {
      // ignore
    }
  };

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    setAnchorEl(null);
  };

  return (
    <>
      <AppBar
        position="sticky"
        color="inherit"
        elevation={0}
        sx={{ borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'background.paper', zIndex: theme.zIndex.appBar }}
      >
        <Container maxWidth="xl">
          <Toolbar disableGutters sx={{ height: 60, gap: 1 }}>
            {/* Logo */}
            <Box
              component={RouterLink}
              to="/"
              sx={{ display: 'flex', alignItems: 'center', gap: 1.25, textDecoration: 'none', color: 'text.primary', mr: 2, flexShrink: 0 }}
            >
              <Box sx={{ width: 30, height: 30, borderRadius: '8px', background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <LogoIcon sx={{ fontSize: 17, color: 'white' }} />
              </Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '0.9375rem', letterSpacing: '-0.02em' }}>
                Procurement Advisor
              </Typography>
            </Box>

            {/* Desktop Nav Links */}
            {!isMobile && (
              <Box sx={{ display: 'flex', gap: 0.25, flex: 1, alignItems: 'center' }}>
                {NAV_ITEMS.map(({ label, path, icon }) => {
                  const active = isActive(path);
                  return (
                    <Button
                      key={path}
                      component={RouterLink}
                      to={path}
                      startIcon={icon}
                      sx={{
                        color: active ? 'primary.main' : 'text.secondary',
                        backgroundColor: active ? 'primary.light' : 'transparent',
                        fontWeight: active ? 600 : 500,
                        fontSize: '0.8125rem',
                        px: 1.25,
                        py: 0.75,
                        borderRadius: '8px',
                        minWidth: 0,
                        '&:hover': { backgroundColor: active ? 'primary.light' : 'action.hover', color: active ? 'primary.main' : 'text.primary' },
                        '& .MuiButton-startIcon': { mr: 0.5 },
                      }}
                    >
                      {label}
                    </Button>
                  );
                })}
              </Box>
            )}

            {/* Right actions */}
            <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {/* Notifications */}
              <Tooltip title="Notifications">
                <IconButton
                  size="small"
                  onClick={(e) => setNotifAnchor(e.currentTarget)}
                  sx={{ color: 'text.secondary' }}
                >
                  <Badge badgeContent={notifCount} color="error" max={9}>
                    <NotificationsIcon fontSize="small" />
                  </Badge>
                </IconButton>
              </Tooltip>

              {/* User menu */}
              {user && (
                <Tooltip title={user.email}>
                  <IconButton size="small" onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ color: 'text.secondary' }}>
                    <AccountIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}

              {/* Mobile hamburger */}
              {isMobile && (
                <IconButton sx={{ color: 'text.secondary' }} onClick={() => setDrawerOpen(true)} aria-label="Open navigation menu">
                  <MenuIcon />
                </IconButton>
              )}
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Notifications Menu */}
      <Menu anchorEl={notifAnchor} open={Boolean(notifAnchor)} onClose={() => setNotifAnchor(null)} PaperProps={{ sx: { width: 340, maxHeight: 400 } }}>
        <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="subtitle2">Notifications</Typography>
          {notifCount > 0 && (
            <Button size="small" onClick={handleMarkAllRead}>Mark all read</Button>
          )}
        </Box>
        <Divider />
        {notifications.length === 0 ? (
          <Box sx={{ py: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">No new notifications</Typography>
          </Box>
        ) : (
          notifications.map((n) => (
            <MenuItem key={n.id} sx={{ whiteSpace: 'normal', py: 1.5 }}>
              <Box>
                <Typography variant="subtitle2" sx={{ fontSize: '0.8125rem' }}>{n.title}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>{n.message}</Typography>
              </Box>
            </MenuItem>
          ))
        )}
      </Menu>

      {/* User Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
        {user && (
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="subtitle2">{user.email}</Typography>
            <Typography variant="caption" color="text.secondary">{user.org_name}</Typography>
          </Box>
        )}
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
          Sign Out
        </MenuItem>
      </Menu>

      {/* Mobile Drawer */}
      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)} PaperProps={{ sx: { width: 272 } }}>
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="subtitle2" fontWeight={700}>Procurement Advisor</Typography>
          <IconButton size="small" onClick={() => setDrawerOpen(false)} sx={{ color: 'text.secondary' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
        <Divider />
        <List sx={{ px: 1.5, py: 1.5, gap: 0.25, display: 'flex', flexDirection: 'column' }}>
          {NAV_ITEMS.map(({ label, path, icon }) => {
            const active = isActive(path);
            return (
              <ListItem key={path} disablePadding>
                <ListItemButton
                  component={RouterLink}
                  to={path}
                  selected={active}
                  onClick={() => setDrawerOpen(false)}
                  sx={{
                    borderRadius: '8px',
                    py: 1,
                    '&.Mui-selected': { backgroundColor: 'primary.light', color: 'primary.main', '& .MuiListItemIcon-root': { color: 'primary.main' } },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 34, color: active ? 'primary.main' : 'text.secondary' }}>
                    {icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={label}
                    primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: active ? 600 : 500 }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
        {user && (
          <>
            <Divider />
            <Box sx={{ p: 2 }}>
              <Typography variant="caption" color="text.secondary" display="block">{user.email}</Typography>
              <Button size="small" startIcon={<LogoutIcon />} onClick={handleLogout} sx={{ mt: 1 }}>
                Sign Out
              </Button>
            </Box>
          </>
        )}
      </Drawer>
    </>
  );
}

export default Navbar;
