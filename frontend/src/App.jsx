import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline, Box } from '@mui/material';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import SupplierAnalysis from './pages/SupplierAnalysis';
import ContractReview from './pages/ContractReview';
import SpendAnalysis from './pages/SpendAnalysis';
import SavingsTracker from './pages/SavingsTracker';
import ContractRenewals from './pages/ContractRenewals';
import Copilot from './pages/Copilot';
import Sourcing from './pages/Sourcing';
import Login from './pages/Login';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { healthCheck } from './services/api';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#4F46E5',
      light: '#EEF2FF',
      dark: '#3730A3',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#06B6D4',
      light: '#CFFAFE',
    },
    success: {
      main: '#10B981',
      light: '#D1FAE5',
      dark: '#059669',
      contrastText: '#FFFFFF',
    },
    warning: {
      main: '#F59E0B',
      light: '#FEF3C7',
      dark: '#D97706',
    },
    error: {
      main: '#EF4444',
      light: '#FEE2E2',
      dark: '#DC2626',
    },
    info: {
      main: '#3B82F6',
      light: '#DBEAFE',
      dark: '#2563EB',
    },
    background: {
      default: '#F8FAFC',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#0F172A',
      secondary: '#64748B',
    },
    divider: '#E2E8F0',
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 700, fontSize: '1.625rem', letterSpacing: '-0.02em' },
    h5: { fontWeight: 700, fontSize: '1.25rem', letterSpacing: '-0.015em' },
    h6: { fontWeight: 600, fontSize: '1rem', letterSpacing: '-0.01em' },
    subtitle1: { fontWeight: 600, fontSize: '0.9375rem' },
    subtitle2: { fontWeight: 600, fontSize: '0.8125rem' },
    body1: { fontSize: '0.9375rem', lineHeight: 1.6 },
    body2: { fontSize: '0.8125rem', lineHeight: 1.5 },
    caption: { fontSize: '0.75rem', letterSpacing: '0.01em' },
    button: { textTransform: 'none', fontWeight: 500, letterSpacing: '0.01em' },
  },
  shape: {
    borderRadius: 10,
  },
  shadows: [
    'none',
    '0px 1px 2px rgba(0,0,0,0.05)',
    '0px 1px 4px rgba(0,0,0,0.07)',
    '0px 2px 8px rgba(0,0,0,0.08)',
    '0px 4px 12px rgba(0,0,0,0.09)',
    '0px 6px 16px rgba(0,0,0,0.1)',
    '0px 8px 24px rgba(0,0,0,0.1)',
    '0px 10px 28px rgba(0,0,0,0.11)',
    '0px 12px 32px rgba(0,0,0,0.11)',
    '0px 16px 40px rgba(0,0,0,0.12)',
    '0px 20px 48px rgba(0,0,0,0.13)',
    '0px 24px 56px rgba(0,0,0,0.14)',
    '0px 28px 64px rgba(0,0,0,0.15)',
    '0px 32px 72px rgba(0,0,0,0.16)',
    '0px 36px 80px rgba(0,0,0,0.17)',
    '0px 40px 88px rgba(0,0,0,0.18)',
    '0px 44px 96px rgba(0,0,0,0.19)',
    '0px 48px 104px rgba(0,0,0,0.2)',
    '0px 52px 112px rgba(0,0,0,0.21)',
    '0px 56px 120px rgba(0,0,0,0.22)',
    '0px 60px 128px rgba(0,0,0,0.23)',
    '0px 64px 136px rgba(0,0,0,0.24)',
    '0px 68px 144px rgba(0,0,0,0.25)',
    '0px 72px 152px rgba(0,0,0,0.26)',
  ],
  components: {
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          border: '1px solid #E2E8F0',
          borderRadius: 12,
          backgroundImage: 'none',
        },
      },
    },
    MuiCardHeader: {
      styleOverrides: {
        root: { paddingBottom: 8 },
        title: { fontSize: '0.9375rem', fontWeight: 600 },
        subheader: { fontSize: '0.8rem' },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '7px 16px',
          fontSize: '0.875rem',
          fontWeight: 500,
          lineHeight: 1.5,
        },
        contained: {
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
          '&:hover': { boxShadow: '0 2px 8px rgba(0,0,0,0.12)' },
        },
        outlined: {
          borderColor: '#E2E8F0',
          '&:hover': { borderColor: '#CBD5E1', backgroundColor: '#F8FAFC' },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 6, fontWeight: 500, fontSize: '0.75rem' },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
          fontSize: '0.7rem',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: '#64748B',
          backgroundColor: '#F8FAFC',
          borderBottom: '1px solid #E2E8F0',
          paddingTop: 10,
          paddingBottom: 10,
        },
        body: {
          fontSize: '0.875rem',
          color: '#0F172A',
          borderBottom: '1px solid #F1F5F9',
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          border: '1px solid #E2E8F0',
          overflow: 'hidden',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 10, border: '1px solid', fontSize: '0.875rem' },
        standardInfo: {
          borderColor: '#BFDBFE',
          backgroundColor: '#EFF6FF',
          color: '#1E40AF',
          '& .MuiAlert-icon': { color: '#3B82F6' },
        },
        standardError: {
          borderColor: '#FECACA',
          backgroundColor: '#FEF2F2',
          color: '#991B1B',
          '& .MuiAlert-icon': { color: '#EF4444' },
        },
        standardSuccess: {
          borderColor: '#A7F3D0',
          backgroundColor: '#ECFDF5',
          color: '#065F46',
          '& .MuiAlert-icon': { color: '#10B981' },
        },
        standardWarning: {
          borderColor: '#FDE68A',
          backgroundColor: '#FFFBEB',
          color: '#92400E',
          '& .MuiAlert-icon': { color: '#F59E0B' },
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: 99, height: 6, backgroundColor: '#E2E8F0' },
        bar: { borderRadius: 99 },
      },
    },
    MuiDivider: {
      styleOverrides: { root: { borderColor: '#E2E8F0' } },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          border: '1px solid #E2E8F0',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        },
      },
    },
    MuiTextField: {
      defaultProps: { size: 'small' },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            '& fieldset': { borderColor: '#E2E8F0' },
            '&:hover fieldset': { borderColor: '#94A3B8' },
            '&.Mui-focused fieldset': { borderColor: '#4F46E5' },
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          '&.Mui-selected': { backgroundColor: '#EEF2FF' },
        },
      },
    },
  },
});

function AuthGuard({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  useEffect(() => {
    healthCheck()
      .then(() => console.log('✓ Backend is online'))
      .catch((err) => console.warn('⚠ Backend connection error:', err.message));
  }, []);

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <AuthGuard>
              <>
                <Navbar />
                <Box component="main" sx={{ flex: 1 }}>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/suppliers" element={<SupplierAnalysis />} />
                    <Route path="/contracts" element={<ContractReview />} />
                    <Route path="/spend" element={<SpendAnalysis />} />
                    <Route path="/savings" element={<SavingsTracker />} />
                    <Route path="/renewals" element={<ContractRenewals />} />
                    <Route path="/copilot" element={<Copilot />} />
                    <Route path="/sourcing" element={<Sourcing />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Box>
              </>
            </AuthGuard>
          }
        />
      </Routes>
    </Box>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
