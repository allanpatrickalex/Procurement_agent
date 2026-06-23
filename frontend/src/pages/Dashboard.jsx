import React, { useEffect, useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
  CardHeader,
  Stack,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Description as DocumentIcon,
  LocalShipping as ShippingIcon,
  Warning as WarningIcon,
  ErrorOutline as ErrorIcon,
} from '@mui/icons-material';
import { getDashboard, getReport } from '../services/api';
import ReportViewer from '../components/ReportViewer';

/**
 * Dashboard page — displays historical analyses and summary metrics.
 */
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

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!dashboardData) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="info">No data available yet</Alert>
      </Container>
    );
  }

  const { summary, supplier_analyses, contract_reviews, spend_reports } =
    dashboardData;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 4 }}>
        Dashboard
      </Typography>

      {selectedReport && (
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h6"
            gutterBottom
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            Report Details
            <Chip
              label="Close"
              onClick={() => setSelectedReport(null)}
              variant="outlined"
            />
          </Typography>

          {reportLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : reportError ? (
            <Alert severity="error">{reportError}</Alert>
          ) : (
            <ReportViewer
              title={selectedReport.title}
              type={selectedReport.type}
              data={selectedReport.data}
            />
          )}
        </Box>
      )}

      {/* Summary Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'primary.light' }}>
            <ShippingIcon
              sx={{ fontSize: 32, color: 'primary.main', mb: 1 }}
            />
            <Typography color="textSecondary" variant="caption">
              Supplier Analyses
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
              {summary?.total_supplier_analyses || 0}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'info.light' }}>
            <DocumentIcon sx={{ fontSize: 32, color: 'info.main', mb: 1 }} />
            <Typography color="textSecondary" variant="caption">
              Contract Reviews
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
              {summary?.total_contract_reviews || 0}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'warning.light' }}>
            <TrendingUpIcon
              sx={{ fontSize: 32, color: 'warning.main', mb: 1 }}
            />
            <Typography color="textSecondary" variant="caption">
              Spend Reports
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
              {summary?.total_spend_reports || 0}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'error.light' }}>
            <WarningIcon sx={{ fontSize: 32, color: 'error.main', mb: 1 }} />
            <Typography color="textSecondary" variant="caption">
              High Risk Contracts
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
              {summary?.high_risk_contracts || 0}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Financial Summary */}
      {summary?.total_spend_analyzed > 0 && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6}>
            <Paper sx={{ p: 3, bgcolor: 'success.light' }}>
              <Typography color="textSecondary" variant="caption">
                Total Spend Analyzed
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                {formatCurrency(summary.total_spend_analyzed)}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Paper sx={{ p: 3, bgcolor: 'success.lighter' }}>
              <Typography color="textSecondary" variant="caption">
                Total Savings Identified
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                {formatCurrency(summary.total_savings_identified)}
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Historical Reports */}
      <Grid container spacing={3}>
        {/* Supplier Analyses */}
        {supplier_analyses && supplier_analyses.length > 0 && (
          <Grid item xs={12} md={6} lg={4}>
            <Card>
              <CardHeader
                avatar={<ShippingIcon />}
                title="Recent Supplier Analyses"
              />
              <CardContent>
                <Stack spacing={2}>
                  {supplier_analyses.slice(0, 5).map((analysis) => (
                    <Box
                      key={analysis.id}
                      sx={{
                        p: 1.5,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' },
                      }}
                      onClick={async () => {
                        setReportError(null);
                        setReportLoading(true);
                        try {
                          const full = await getReport('supplier', analysis.id);
                          setSelectedReport({
                            title: `Supplier Analysis #${analysis.id}`,
                            type: 'supplier',
                            data: full,
                          });
                        } catch (err) {
                          setReportError(err.message);
                        } finally {
                          setReportLoading(false);
                        }
                      }}
                    >
                      <Typography variant="subtitle2">
                        {analysis.recommended_supplier}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {formatDate(analysis.created_at)} • Score:{' '}
                        {analysis.score}
                      </Typography>
                    </Box>
                  ))}
                  {supplier_analyses.length === 0 && (
                    <Typography variant="body2" color="textSecondary">
                      No supplier analyses yet
                    </Typography>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Contract Reviews */}
        {contract_reviews && contract_reviews.length > 0 && (
          <Grid item xs={12} md={6} lg={4}>
            <Card>
              <CardHeader
                avatar={<DocumentIcon />}
                title="Recent Contract Reviews"
              />
              <CardContent>
                <Stack spacing={2}>
                  {contract_reviews.slice(0, 5).map((review) => (
                    <Box
                      key={review.id}
                      sx={{
                        p: 1.5,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' },
                      }}
                      onClick={async () => {
                        setReportError(null);
                        setReportLoading(true);
                        try {
                          const full = await getReport('contract', review.id);
                          setSelectedReport({
                            title: `Contract Review #${review.id}`,
                            type: 'contract',
                            data: full,
                          });
                        } catch (err) {
                          setReportError(err.message);
                        } finally {
                          setReportLoading(false);
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        {review.risk_level === 'High' && (
                          <ErrorIcon sx={{ color: 'error.main' }} />
                        )}
                        {review.risk_level === 'Medium' && (
                          <WarningIcon sx={{ color: 'warning.main' }} />
                        )}
                        <Typography variant="subtitle2">
                          {review.risk_level} Risk
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="textSecondary">
                        {formatDate(review.created_at)}
                      </Typography>
                    </Box>
                  ))}
                  {contract_reviews.length === 0 && (
                    <Typography variant="body2" color="textSecondary">
                      No contract reviews yet
                    </Typography>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Spend Reports */}
        {spend_reports && spend_reports.length > 0 && (
          <Grid item xs={12} md={6} lg={4}>
            <Card>
              <CardHeader
                avatar={<TrendingUpIcon />}
                title="Recent Spend Reports"
              />
              <CardContent>
                <Stack spacing={2}>
                  {spend_reports.slice(0, 5).map((report) => (
                    <Box
                      key={report.id}
                      sx={{
                        p: 1.5,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' },
                      }}
                      onClick={async () => {
                        setReportError(null);
                        setReportLoading(true);
                        try {
                          const full = await getReport('spend', report.id);
                          setSelectedReport({
                            title: `Spend Report #${report.id}`,
                            type: 'spend',
                            data: full,
                          });
                        } catch (err) {
                          setReportError(err.message);
                        } finally {
                          setReportLoading(false);
                        }
                      }}
                    >
                      <Typography variant="subtitle2">
                        {formatCurrency(report.total_spend)}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Savings:{' '}
                        {formatCurrency(report.savings_estimate)}
                      </Typography>
                      <Typography variant="caption" color="textSecondary" display="block">
                        {formatDate(report.created_at)}
                      </Typography>
                    </Box>
                  ))}
                  {spend_reports.length === 0 && (
                    <Typography variant="body2" color="textSecondary">
                      No spend reports yet
                    </Typography>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Container>
  );
}

export default Dashboard;
