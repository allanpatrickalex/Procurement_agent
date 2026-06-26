import React, { useEffect, useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Stack,
  Alert,
  Skeleton,
  Chip,
  Button,
  Divider,
  IconButton,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Description as DocumentIcon,
  LocalShipping as ShippingIcon,
  Warning as WarningIcon,
  Close as CloseIcon,
  ArrowForwardIos as ChevronIcon,
  AutoAwesome as EmptyIcon,
  Savings as SavingsIcon,
  AttachMoney as SpendIcon,
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { getDashboard, getReport } from '../services/api';
import ReportViewer from '../components/ReportViewer';

function StatCard({ icon, label, value, color = 'primary' }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: '10px',
              backgroundColor: `${color}.light`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {React.cloneElement(icon, { sx: { color: `${color}.main`, fontSize: 20 } })}
          </Box>
        </Box>
        <Typography variant="h4" fontWeight={700} sx={{ mb: 0.25, fontSize: '1.875rem' }}>
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
      </CardContent>
    </Card>
  );
}

function StatCardSkeleton() {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 3 }}>
        <Skeleton variant="rounded" width={42} height={42} sx={{ borderRadius: '10px', mb: 2 }} />
        <Skeleton variant="text" width={48} height={44} sx={{ mb: 0.5 }} />
        <Skeleton variant="text" width={110} height={20} />
      </CardContent>
    </Card>
  );
}

function ReportRow({ primary, secondary, badge, onClick }) {
  return (
    <Box
      onClick={onClick}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        p: 1.5,
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        '&:hover': {
          backgroundColor: 'primary.light',
          '& .chevron': { opacity: 1, transform: 'translateX(2px)' },
        },
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="subtitle2" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {primary}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {secondary}
        </Typography>
      </Box>
      {badge}
      <ChevronIcon
        className="chevron"
        sx={{ fontSize: 12, color: 'text.disabled', opacity: 0, transition: 'all 0.15s ease', flexShrink: 0 }}
      />
    </Box>
  );
}

function getRiskChip(level) {
  if (!level) return null;
  const color = level === 'High' ? 'error' : level === 'Low' ? 'success' : 'warning';
  return <Chip label={level} size="small" color={color} sx={{ fontWeight: 600, fontSize: '0.7rem' }} />;
}

function Dashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const data = await getDashboard();
        setDashboardData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const formatCurrency = (value) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  const openReport = async (type, id, title) => {
    setReportError(null);
    setReportLoading(true);
    setSelectedReport({ title, type, data: null });
    try {
      const full = await getReport(type, id);
      setSelectedReport({ title, type, data: full });
    } catch (err) {
      setReportError(err.message);
    } finally {
      setReportLoading(false);
    }
  };

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 5 }}>
        <Skeleton variant="text" width={180} height={40} sx={{ mb: 0.5 }} />
        <Skeleton variant="text" width={300} height={24} sx={{ mb: 4 }} />
        <Grid container spacing={2.5} sx={{ mb: 4 }}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={6} sm={6} md={3} key={i}>
              <StatCardSkeleton />
            </Grid>
          ))}
        </Grid>
        <Grid container spacing={3}>
          {[1, 2, 3].map((i) => (
            <Grid item xs={12} md={4} key={i}>
              <Skeleton variant="rounded" height={280} sx={{ borderRadius: '12px' }} />
            </Grid>
          ))}
        </Grid>
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

  const { summary, supplier_analyses, contract_reviews, spend_reports } = dashboardData || {};

  const isEmpty =
    !supplier_analyses?.length && !contract_reviews?.length && !spend_reports?.length;

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      {/* Page Header */}
      <Box sx={{ mb: 5 }}>
        <Typography variant="h4" gutterBottom sx={{ mb: 0.5 }}>
          Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Overview of all AI-powered procurement analyses.
        </Typography>
      </Box>

      {/* Selected Report Panel */}
      {selectedReport && (
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">{selectedReport.title}</Typography>
            <IconButton
              size="small"
              onClick={() => { setSelectedReport(null); setReportError(null); }}
              sx={{ ml: 'auto', color: 'text.secondary' }}
              aria-label="Close report"
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          {reportLoading ? (
            <Skeleton variant="rounded" height={400} sx={{ borderRadius: '12px' }} />
          ) : reportError ? (
            <Alert severity="error">{reportError}</Alert>
          ) : (
            <ReportViewer
              title={selectedReport.title}
              type={selectedReport.type}
              data={selectedReport.data}
            />
          )}
          <Divider sx={{ mt: 4 }} />
          <Box sx={{ mt: 4 }} />
        </Box>
      )}

      {/* Stat Cards */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        <Grid item xs={6} sm={6} md={3}>
          <StatCard
            icon={<ShippingIcon />}
            label="Supplier Analyses"
            value={summary?.total_supplier_analyses ?? 0}
            color="primary"
          />
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <StatCard
            icon={<DocumentIcon />}
            label="Contract Reviews"
            value={summary?.total_contract_reviews ?? 0}
            color="info"
          />
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <StatCard
            icon={<TrendingUpIcon />}
            label="Spend Reports"
            value={summary?.total_spend_reports ?? 0}
            color="success"
          />
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <StatCard
            icon={<WarningIcon />}
            label="High Risk Contracts"
            value={summary?.high_risk_contracts ?? 0}
            color="error"
          />
        </Grid>
      </Grid>

      {/* Financial Summary */}
      {summary?.total_spend_analyzed > 0 && (
        <Grid container spacing={2.5} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6}>
            <Box
              sx={{
                p: 3,
                borderRadius: '12px',
                border: '1px solid #BFDBFE',
                backgroundColor: '#EFF6FF',
                display: 'flex',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <Box sx={{ width: 40, height: 40, borderRadius: '10px', backgroundColor: '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <SpendIcon sx={{ color: '#3B82F6', fontSize: 20 }} />
              </Box>
              <Box>
                <Typography variant="caption" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', color: '#1E40AF' }}>
                  Total Spend Analyzed
                </Typography>
                <Typography variant="h6" fontWeight={700} color="#1E3A8A">
                  {formatCurrency(summary.total_spend_analyzed)}
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box
              sx={{
                p: 3,
                borderRadius: '12px',
                border: '1px solid #A7F3D0',
                backgroundColor: '#ECFDF5',
                display: 'flex',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <Box sx={{ width: 40, height: 40, borderRadius: '10px', backgroundColor: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <SavingsIcon sx={{ color: '#10B981', fontSize: 20 }} />
              </Box>
              <Box>
                <Typography variant="caption" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', color: '#065F46' }}>
                  Total Savings Identified
                </Typography>
                <Typography variant="h6" fontWeight={700} color="#064E3B">
                  {formatCurrency(summary.total_savings_identified)}
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      )}

      {/* Empty State */}
      {isEmpty ? (
        <Box
          sx={{
            textAlign: 'center',
            py: 10,
            px: 4,
            border: '1px dashed',
            borderColor: 'divider',
            borderRadius: '16px',
            backgroundColor: 'background.paper',
          }}
        >
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: '16px',
              backgroundColor: 'primary.light',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2.5,
            }}
          >
            <EmptyIcon sx={{ color: 'primary.main', fontSize: 30 }} />
          </Box>
          <Typography variant="h5" gutterBottom>
            No analyses yet
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 440, mx: 'auto', mb: 4 }}>
            Upload supplier quotes, contracts, or spend data to get AI-powered procurement insights.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="center">
            <Button
              variant="contained"
              component={RouterLink}
              to="/suppliers"
              startIcon={<ShippingIcon />}
            >
              Analyze Suppliers
            </Button>
            <Button
              variant="outlined"
              component={RouterLink}
              to="/contracts"
              startIcon={<DocumentIcon />}
            >
              Review Contract
            </Button>
            <Button
              variant="outlined"
              component={RouterLink}
              to="/spend"
              startIcon={<TrendingUpIcon />}
            >
              Analyze Spend
            </Button>
          </Stack>
        </Box>
      ) : (
        /* Historical Reports */
        <Grid container spacing={3}>
          {/* Supplier Analyses */}
          {supplier_analyses?.length > 0 && (
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%' }}>
                <CardHeader
                  avatar={
                    <Box sx={{ width: 32, height: 32, borderRadius: '8px', backgroundColor: 'primary.light', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ShippingIcon sx={{ fontSize: 17, color: 'primary.main' }} />
                    </Box>
                  }
                  title="Supplier Analyses"
                  action={
                    <Chip
                      label={supplier_analyses.length}
                      size="small"
                      sx={{ backgroundColor: '#F1F5F9', color: 'text.secondary', fontWeight: 600 }}
                    />
                  }
                />
                <Divider />
                <CardContent sx={{ pt: 1.5 }}>
                  <Stack spacing={0.5}>
                    {supplier_analyses.slice(0, 5).map((analysis) => (
                      <ReportRow
                        key={analysis.id}
                        primary={analysis.recommended_supplier}
                        secondary={`${formatDate(analysis.created_at)} · Score: ${analysis.score}`}
                        onClick={() => openReport('supplier', analysis.id, `Supplier Analysis #${analysis.id}`)}
                      />
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Contract Reviews */}
          {contract_reviews?.length > 0 && (
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%' }}>
                <CardHeader
                  avatar={
                    <Box sx={{ width: 32, height: 32, borderRadius: '8px', backgroundColor: 'info.light', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <DocumentIcon sx={{ fontSize: 17, color: 'info.main' }} />
                    </Box>
                  }
                  title="Contract Reviews"
                  action={
                    <Chip
                      label={contract_reviews.length}
                      size="small"
                      sx={{ backgroundColor: '#F1F5F9', color: 'text.secondary', fontWeight: 600 }}
                    />
                  }
                />
                <Divider />
                <CardContent sx={{ pt: 1.5 }}>
                  <Stack spacing={0.5}>
                    {contract_reviews.slice(0, 5).map((review) => (
                      <ReportRow
                        key={review.id}
                        primary={`Contract Review #${review.id}`}
                        secondary={formatDate(review.created_at)}
                        badge={getRiskChip(review.risk_level)}
                        onClick={() => openReport('contract', review.id, `Contract Review #${review.id}`)}
                      />
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Spend Reports */}
          {spend_reports?.length > 0 && (
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%' }}>
                <CardHeader
                  avatar={
                    <Box sx={{ width: 32, height: 32, borderRadius: '8px', backgroundColor: 'success.light', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <TrendingUpIcon sx={{ fontSize: 17, color: 'success.main' }} />
                    </Box>
                  }
                  title="Spend Reports"
                  action={
                    <Chip
                      label={spend_reports.length}
                      size="small"
                      sx={{ backgroundColor: '#F1F5F9', color: 'text.secondary', fontWeight: 600 }}
                    />
                  }
                />
                <Divider />
                <CardContent sx={{ pt: 1.5 }}>
                  <Stack spacing={0.5}>
                    {spend_reports.slice(0, 5).map((report) => (
                      <ReportRow
                        key={report.id}
                        primary={formatCurrency(report.total_spend)}
                        secondary={`Savings: ${formatCurrency(report.savings_estimate)} · ${formatDate(report.created_at)}`}
                        onClick={() => openReport('spend', report.id, `Spend Report #${report.id}`)}
                      />
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      )}
    </Container>
  );
}

export default Dashboard;
