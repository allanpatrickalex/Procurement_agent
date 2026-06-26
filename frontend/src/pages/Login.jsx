import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  Tabs,
  Tab,
  Stack,
} from '@mui/material';
import { Inventory2 as LogoIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [form, setForm] = useState({ email: '', password: '', orgName: '' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (tab === 0) {
        await login(form.email, form.password);
      } else {
        if (!form.orgName.trim()) {
          setError('Organization name is required');
          setLoading(false);
          return;
        }
        await register(form.email, form.password, form.orgName);
      }
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fillDevCredentials = () => {
    setForm({ email: 'admin@local.dev', password: 'admin123', orgName: '' });
    setTab(0);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 2,
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4, justifyContent: 'center' }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <LogoIcon sx={{ fontSize: 22, color: 'white' }} />
          </Box>
          <Typography variant="h5" fontWeight={700}>
            Procurement Advisor
          </Typography>
        </Box>

        <Card>
          <CardContent sx={{ p: 3 }}>
            <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
              <Tab label="Sign In" />
              <Tab label="Create Account" />
            </Tabs>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <Stack spacing={2}>
                {tab === 1 && (
                  <TextField
                    label="Organization name"
                    name="orgName"
                    value={form.orgName}
                    onChange={handleChange}
                    fullWidth
                    required
                    autoFocus
                  />
                )}
                <TextField
                  label="Email address"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  fullWidth
                  required
                  autoFocus={tab === 0}
                />
                <TextField
                  label="Password"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  fullWidth
                  required
                />
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={loading}
                  sx={{ py: 1.25, fontSize: '0.9375rem' }}
                >
                  {loading ? 'Please wait…' : tab === 0 ? 'Sign In' : 'Create Account'}
                </Button>
              </Stack>
            </form>

            <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                Local development — use default credentials
              </Typography>
              <Button size="small" variant="outlined" onClick={fillDevCredentials}>
                Fill dev credentials
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}

export default Login;
