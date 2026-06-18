import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline, Box } from '@mui/material';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import SupplierAnalysis from './pages/SupplierAnalysis';
import ContractReview from './pages/ContractReview';
import SpendAnalysis from './pages/SpendAnalysis';
import { healthCheck } from './services/api';

/**
 * Create Material UI theme
 */
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
      light: '#e3f2fd',
    },
    secondary: {
      main: '#dc004e',
    },
    success: {
      main: '#2e7d32',
      light: '#e8f5e9',
      lighter: '#f1f8f6',
    },
    warning: {
      main: '#f57c00',
      light: '#fff3e0',
    },
    error: {
      main: '#d32f2f',
      light: '#ffebee',
    },
    info: {
      main: '#0288d1',
      light: '#e1f5fe',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontSize: '2.125rem',
      fontWeight: 600,
    },
    h6: {
      fontSize: '1.25rem',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 8,
  },
});

/**
 * Main application component with routing
 */
function App() {
  useEffect(() => {
    // Check backend health
    healthCheck()
      .then(() => {
        console.log('✓ Backend is online');
      })
      .catch((err) => {
        console.warn('⚠ Backend connection error:', err.message);
      });
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <Navbar />
          <Box sx={{ flex: 1 }}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/suppliers" element={<SupplierAnalysis />} />
              <Route path="/contracts" element={<ContractReview />} />
              <Route path="/spend" element={<SpendAnalysis />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;
