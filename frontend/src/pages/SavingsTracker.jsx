import React, { useEffect, useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  Alert,
  Skeleton,
  Stack,
  Divider,
  LinearProgress,
} from '@mui/material';
import {
  Savings as SavingsIcon,
  CheckCircle as DoneIcon,
  HourglassTop as InProgressIcon,
  TrendingUp as IdentifiedIcon,
} from '@mui/icons-material';
import { getSavings, updateSavingsStatus } from '../services/api';

const STATUS_CONFIG = {
  identified: { label: 'Identified', color: 'info', icon: <IdentifiedIcon fontSize="small" /> },
  in_progress: { label: 'In Progress', color: 'warning', icon: <InProgressIcon fontSize="small" /> },
  realized: { label: 'Realized', color: 'success', icon: <DoneIcon fontSize="small" /> },
};

function formatCurrency(val) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val || 0);
}

function MetricBox({ label, value, color = '#EFF6FF', textColor = '#1E40AF', borderColor = '#BFDBFE', icon }) {
  return (
    <Box
      sx={{
        p: 2.5,
        borderRadius: '12px',
        border: `1px solid ${borderColor}`,
        backgroundColor: color,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
      }}
    >
      <Box sx={{ width: 40, height: 40, borderRadius: '10px', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {React.cloneElement(icon, { sx: { color: textColor, fontSize: 20 } })}
      </Box>
      <Box>
        <Typography variant="caption" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', color: textColor }}>
          {label}
        </Typography>
        <Typography variant="h6" fontWeight={700} color={textColor}>
          {formatCurrency(value)}
        </Typography>
      </Box>
    </Box>
  );
}

function SavingsTracker() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      const result = await getSavings();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleStatusChange = async (id, newStatus) => {
    setUpdating(id);
    try {
      await updateSavingsStatus(id, newStatus);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 5 }}>
        <Skeleton variant="text" width={200} height={40} sx={{ mb: 4 }} />
        <Grid container spacing={2.5} sx={{ mb: 4 }}>
          {[1, 2, 3].map((i) => <Grid item xs={12} sm={4} key={i}><Skeleton variant="rounded" height={90} sx={{ borderRadius: '12px' }} /></Grid>)}
        </Grid>
        <Skeleton variant="rounded" height={400} sx={{ borderRadius: '12px' }} />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 5 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  const { total_identified = 0, total_realized = 0, total_in_progress = 0, entries = [] } = data || {};
  const realizationRate = total_identified > 0 ? (total_realized / total_identified) * 100 : 0;

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      <Box sx={{ mb: 5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <Box sx={{ width: 36, height: 36, borderRadius: '10px', backgroundColor: 'success.light', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <SavingsIcon sx={{ color: 'success.main', fontSize: 20 }} />
          </Box>
          <Typography variant="h4">Savings Tracker</Typography>
        </Box>
        <Typography variant="body1" color="text.secondary" sx={{ ml: 6.5 }}>
          Track identified savings from all analyses through to realized value.
        </Typography>
      </Box>

      {/* Summary metrics */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <MetricBox label="Total Identified" value={total_identified} icon={<IdentifiedIcon />} color="#EFF6FF" borderColor="#BFDBFE" textColor="#1E40AF" />
        </Grid>
        <Grid item xs={12} sm={4}>
          <MetricBox label="In Progress" value={total_in_progress} icon={<InProgressIcon />} color="#FFFBEB" borderColor="#FDE68A" textColor="#92400E" />
        </Grid>
        <Grid item xs={12} sm={4}>
          <MetricBox label="Realized" value={total_realized} icon={<DoneIcon />} color="#ECFDF5" borderColor="#A7F3D0" textColor="#065F46" />
        </Grid>
      </Grid>

      {/* Realization progress */}
      {total_identified > 0 && (
        <Card sx={{ mb: 4 }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
              <Typography variant="subtitle2">Realization Rate</Typography>
              <Typography variant="subtitle2" color="success.main">{realizationRate.toFixed(0)}%</Typography>
            </Box>
            <LinearProgress variant="determinate" value={Math.min(realizationRate, 100)} color="success" sx={{ height: 8 }} />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              {formatCurrency(total_realized)} realized of {formatCurrency(total_identified)} identified
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Savings entries */}
      {entries.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 10, border: '1px dashed', borderColor: 'divider', borderRadius: '16px', backgroundColor: 'background.paper' }}>
          <Box sx={{ width: 64, height: 64, borderRadius: '16px', backgroundColor: 'success.light', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
            <SavingsIcon sx={{ color: 'success.main', fontSize: 30 }} />
          </Box>
          <Typography variant="h5" gutterBottom>No savings identified yet</Typography>
          <Typography variant="body1" color="text.secondary">Run a Spend Analysis or Supplier Analysis to start tracking savings.</Typography>
        </Box>
      ) : (
        <Card>
          <CardContent sx={{ p: 0 }}>
            {entries.map((entry, idx) => {
              const cfg = STATUS_CONFIG[entry.status] || STATUS_CONFIG.identified;
              return (
                <Box key={entry.id}>
                  {idx > 0 && <Divider />}
                  <Box sx={{ p: 2.5, display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                        <Typography variant="subtitle2">
                          {entry.category || `${entry.source_type} #${entry.source_id}`}
                        </Typography>
                        <Chip
                          label={cfg.label}
                          size="small"
                          color={cfg.color}
                          icon={cfg.icon}
                          sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                        />
                      </Box>
                      {entry.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {entry.description}
                        </Typography>
                      )}
                      <Box sx={{ display: 'flex', gap: 3 }}>
                        <Box>
                          <Typography variant="caption" color="text.secondary">Identified</Typography>
                          <Typography variant="subtitle2" color="info.main">{formatCurrency(entry.identified_amount)}</Typography>
                        </Box>
                        {entry.realized_amount > 0 && (
                          <Box>
                            <Typography variant="caption" color="text.secondary">Realized</Typography>
                            <Typography variant="subtitle2" color="success.main">{formatCurrency(entry.realized_amount)}</Typography>
                          </Box>
                        )}
                      </Box>
                    </Box>
                    <Stack direction="row" spacing={1} flexShrink={0}>
                      {entry.status === 'identified' && (
                        <Button size="small" variant="outlined" disabled={updating === entry.id} onClick={() => handleStatusChange(entry.id, 'in_progress')}>
                          Start
                        </Button>
                      )}
                      {entry.status === 'in_progress' && (
                        <Button size="small" variant="contained" color="success" disabled={updating === entry.id} onClick={() => handleStatusChange(entry.id, 'realized')}>
                          Mark Realized
                        </Button>
                      )}
                    </Stack>
                  </Box>
                </Box>
              );
            })}
          </CardContent>
        </Card>
      )}
    </Container>
  );
}

export default SavingsTracker;
