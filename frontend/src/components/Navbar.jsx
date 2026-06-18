import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
  Container,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import {
  Dashboard as DashboardIcon,
  LocalShipping as SupplierIcon,
  Description as ContractIcon,
  TrendingDown as SpendIcon,
} from '@mui/icons-material';

/**
 * Application navigation bar with links to all major sections.
 */
function Navbar() {
  return (
    <AppBar position="static" sx={{ mb: 4, boxShadow: 2 }}>
      <Container maxWidth="lg">
        <Toolbar disableGutters>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              mr: 4,
              flex: '0 0 auto',
            }}
          >
            <Typography
              variant="h6"
              component={RouterLink}
              to="/"
              sx={{
                fontWeight: 700,
                textDecoration: 'none',
                color: 'inherit',
                fontSize: '1.25rem',
              }}
            >
              Procurement Advisor
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 2, ml: 'auto', alignItems: 'center' }}>
            <Button
              color="inherit"
              component={RouterLink}
              to="/"
              startIcon={<DashboardIcon />}
              sx={{
                textTransform: 'none',
                fontSize: '0.95rem',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
              }}
            >
              Dashboard
            </Button>

            <Button
              color="inherit"
              component={RouterLink}
              to="/suppliers"
              startIcon={<SupplierIcon />}
              sx={{
                textTransform: 'none',
                fontSize: '0.95rem',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
              }}
            >
              Suppliers
            </Button>

            <Button
              color="inherit"
              component={RouterLink}
              to="/contracts"
              startIcon={<ContractIcon />}
              sx={{
                textTransform: 'none',
                fontSize: '0.95rem',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
              }}
            >
              Contracts
            </Button>

            <Button
              color="inherit"
              component={RouterLink}
              to="/spend"
              startIcon={<SpendIcon />}
              sx={{
                textTransform: 'none',
                fontSize: '0.95rem',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
              }}
            >
              Spend
            </Button>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}

export default Navbar;
