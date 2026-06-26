import React, { useEffect, useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Button,
  Alert,
  Skeleton,
  Stack,
  Divider,
  Grid,
} from '@mui/material';
import {
  EventRepeat as RenewalIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as OkIcon,
  NotificationsActive as AlertIcon,
} from '@mui/icons-material';
import { getRenewals, updateRenewalStatus, sweepRenewalAlerts } from '../services/api';

const URGENCY_CONFIG = {
  overdue: { label: 'Overdue', color: 'error', icon: <ErrorIcon fontSize="small" /> },
  critical: { label: 'Critical', color: 'error', icon: <ErrorIcon fontSize="small" /> },
  warning: { label: 'Due Soon', color: 'warning', icon: <WarningIcon fontSize="small" /> },
  upcoming: { label: 'Upcoming', color: 'info', icon: <RenewalIcon fontSize="small" /> },
  ok: { label: 'OK', color: 'success', icon: <OkIcon fontSize="small" /> },
};

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function ContractRenewals() {
  const [renewals, setRenewals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sweeping, setSweeping] = useState(false);
  const [sweepResult, setSweepResult] = useState(null);
  const [updating, setUpdating] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      const data = await getRenewals();
      setRenewals(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSweep = async () => {
    setSweeping(true);
    setSweepResult(null);
    try {
      const result = await sweepRenewalAlerts(60);
      setSweepResult(result.notifications_created);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSweeping(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    setUpdating(id);
    try {
      await updateRenewalStatus(id, status);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdating(null);
    }
  };

  // Group by urgency
  const urgent = renewals.filter((r) => ['overdue', 'critical'].includes(r.urgency));
  const warning = renewals.filter((r) => r.urgency === 'warning');
  const upcoming = renewals.filter((r) => ['upcoming', 'ok'].includes(r.urgency));

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 5 }}>
        <Skeleton variant="text" width={220} height={40} sx={{ mb: 4 }} />
        <Skeleton variant="rounded" height={350} sx={{ borderRadius: '12px' }} />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      <Box sx={{ mb: 5, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
            <Box sx={{ width: 36, height: 36, borderRadius: '10px', backgroundColor: 'warning.light', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <RenewalIcon sx={{ color: 'warning.dark', fontSize: 20 }} />
            </Box>
            <Typography variant="h4">Contract Renewals</Typography>
          </Box>
          <Typography variant="body1" color="text.secondary" sx={{ ml: 6.5 }}>
            Track auto-renewals and notice deadlines so you're never caught off-guard.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5}>
          {sweepResult !== null && (
            <Alert severity="success" sx={{ py: 0.5 }}>
              {sweepResult} alert{sweepResult !== 1 ? 's' : ''} created
            </Alert>
          )}
          <Button variant="outlined" startIcon={<AlertIcon />} onClick={handleSweep} disabled={sweeping}>
            {sweeping ? 'Scanning…' : 'Scan Alerts (60 days)'}
          </Button>
        </Stack>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {renewals.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 10, border: '1px dashed', borderColor: 'divider', borderRadius: '16px', backgroundColor: 'background.paper' }}>
          <Box sx={{ width: 64, height: 64, borderRadius: '16px', backgroundColor: 'warning.light', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
            <RenewalIcon sx={{ color: 'warning.dark', fontSize: 30 }} />
          </Box>
          <Typography variant="h5" gutterBottom>No renewal dates tracked</Typography>
          <Typography variant="body1" color="text.secondary">
            Review a contract PDF and the AI will automatically extract renewal dates and notice periods.
          </Typography>
        </Box>
      ) : (
        <Stack spacing={3}>
          {urgent.length > 0 && (
            <RenewalGroup title="Urgent" entries={urgent} onStatusChange={handleStatusChange} updating={updating} />
          )}
          {warning.length > 0 && (
            <RenewalGroup title="Due Within 30 Days" entries={warning} onStatusChange={handleStatusChange} updating={updating} />
          )}
          {upcoming.length > 0 && (
            <RenewalGroup title="Upcoming" entries={upcoming} onStatusChange={handleStatusChange} updating={updating} />
          )}
        </Stack>
      )}
    </Container>
  );
}

function RenewalGroup({ title, entries, onStatusChange, updating }) {
  return (
    <Card>
      <CardContent sx={{ p: 0 }}>
        <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.7rem' }}>
            {title}
          </Typography>
        </Box>
        {entries.map((r, idx) => {
          const cfg = URGENCY_CONFIG[r.urgency] || URGENCY_CONFIG.ok;
          return (
            <Box key={r.id}>
              {idx > 0 && <Divider />}
              <Box sx={{ p: 2.5, display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75, flexWrap: 'wrap' }}>
                    <Typography variant="subtitle2">
                      {r.contract_name || `Contract #${r.contract_id}`}
                    </Typography>
                    <Chip label={cfg.label} size="small" color={cfg.color} icon={cfg.icon} sx={{ fontWeight: 600, fontSize: '0.7rem' }} />
                    {r.auto_renewal && (
                      <Chip label="Auto-renews" size="small" variant="outlined" color="warning" sx={{ fontSize: '0.7rem' }} />
                    )}
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" color="text.secondary">Renewal Date</Typography>
                      <Typography variant="body2" fontWeight={500}>{formatDate(r.renewal_date)}</Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" color="text.secondary">Notice Deadline</Typography>
                      <Typography variant="body2" fontWeight={500} color={r.urgency !== 'ok' ? 'error.main' : 'text.primary'}>
                        {formatDate(r.notice_deadline)}
                      </Typography>
                    </Grid>
                    {r.days_until_notice !== null && (
                      <Grid item xs={6} sm={3}>
                        <Typography variant="caption" color="text.secondary">Days Until Notice</Typography>
                        <Typography variant="body2" fontWeight={600} color={r.days_until_notice <= 7 ? 'error.main' : r.days_until_notice <= 30 ? 'warning.main' : 'text.primary'}>
                          {r.days_until_notice < 0 ? `${Math.abs(r.days_until_notice)} days overdue` : `${r.days_until_notice} days`}
                        </Typography>
                      </Grid>
                    )}
                    {r.notice_period_days && (
                      <Grid item xs={6} sm={3}>
                        <Typography variant="caption" color="text.secondary">Notice Period</Typography>
                        <Typography variant="body2">{r.notice_period_days} days</Typography>
                      </Grid>
                    )}
                  </Grid>
                </Box>
                <Stack direction="row" spacing={1} flexShrink={0}>
                  <Button size="small" variant="outlined" color="success" disabled={updating === r.id} onClick={() => onStatusChange(r.id, 'renewed')}>
                    Renewed
                  </Button>
                  <Button size="small" variant="outlined" color="error" disabled={updating === r.id} onClick={() => onStatusChange(r.id, 'cancelled')}>
                    Cancel
                  </Button>
                </Stack>
              </Box>
            </Box>
          );
        })}
      </CardContent>
    </Card>
  );
}

export default ContractRenewals;
