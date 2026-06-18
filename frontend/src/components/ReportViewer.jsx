import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Grid,
  Stack,
  Divider,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';

/**
 * Generic report viewer component for displaying analysis results.
 *
 * @param {Object} props - Component props
 * @param {string} props.title - Report title
 * @param {string} props.type - Report type: 'supplier', 'contract', or 'spend'
 * @param {Object} props.data - Report data
 */
function ReportViewer({ title, type, data }) {
  if (!data) {
    return (
      <Card sx={{ bgcolor: 'background.paper' }}>
        <CardHeader title={title} />
        <CardContent>
          <Typography color="textSecondary">No data available</Typography>
        </CardContent>
      </Card>
    );
  }

  const getRiskColor = (level) => {
    const levelLower = level?.toLowerCase() || 'medium';
    if (levelLower === 'low') return 'success';
    if (levelLower === 'high') return 'error';
    return 'warning';
  };

  const getRiskIcon = (level) => {
    const levelLower = level?.toLowerCase() || 'medium';
    if (levelLower === 'low') return <CheckCircleIcon />;
    if (levelLower === 'high') return <ErrorIcon />;
    return <WarningIcon />;
  };

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
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Supplier Analysis Report
  if (type === 'supplier') {
    return (
      <Card sx={{ bgcolor: 'background.paper' }}>
        <CardHeader
          title={title}
          subheader={`Created: ${formatDate(data.created_at)}`}
        />
        <CardContent>
          <Stack spacing={3}>
            {/* Executive Summary */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Executive Summary
              </Typography>
              <Paper sx={{ p: 2, bgcolor: 'info.light' }}>
                <Typography>{data.executive_summary}</Typography>
              </Paper>
            </Box>

            {/* Recommendation */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Recommended Supplier
              </Typography>
              <Chip
                label={data.recommended_supplier}
                color="primary"
                variant="outlined"
                sx={{ fontSize: '1rem', p: 3 }}
              />
            </Box>

            {/* Supplier Scores */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Supplier Rankings
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead sx={{ bgcolor: 'primary.light' }}>
                    <TableRow>
                      <TableCell>Rank</TableCell>
                      <TableCell>Supplier</TableCell>
                      <TableCell align="right">Score</TableCell>
                      <TableCell>Highlights</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.supplier_scores?.map((supplier, idx) => (
                      <TableRow
                        key={idx}
                        sx={{
                          backgroundColor:
                            supplier.supplier_name ===
                            data.recommended_supplier
                              ? 'success.light'
                              : 'inherit',
                        }}
                      >
                        <TableCell>{supplier.rank}</TableCell>
                        <TableCell>{supplier.supplier_name}</TableCell>
                        <TableCell align="right">
                          <strong>{supplier.score}/100</strong>
                        </TableCell>
                        <TableCell>
                          {supplier.highlights?.join(', ') || 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>

            {/* Reasoning */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Analysis Reasoning
              </Typography>
              <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {data.reasoning}
                </Typography>
              </Paper>
            </Box>

            {/* Files Uploaded */}
            {data.uploaded_files && data.uploaded_files.length > 0 && (
              <Box>
                <Typography variant="subtitle2" color="textSecondary">
                  Files Analyzed: {data.uploaded_files.join(', ')}
                </Typography>
              </Box>
            )}
          </Stack>
        </CardContent>
      </Card>
    );
  }

  // Contract Review Report
  if (type === 'contract') {
    return (
      <Card sx={{ bgcolor: 'background.paper' }}>
        <CardHeader
          title={title}
          subheader={`Created: ${formatDate(data.created_at)}`}
        />
        <CardContent>
          <Stack spacing={3}>
            {/* Risk Level */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Risk Assessment
              </Typography>
              <Chip
                icon={getRiskIcon(data.risk_level)}
                label={data.risk_level}
                color={getRiskColor(data.risk_level)}
                variant="outlined"
                sx={{ fontSize: '1rem', p: 3 }}
              />
            </Box>

            {/* Executive Summary */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Executive Summary
              </Typography>
              <Paper sx={{ p: 2, bgcolor: 'info.light' }}>
                <Typography>{data.executive_summary}</Typography>
              </Paper>
            </Box>

            {/* Risks */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Identified Risks
              </Typography>
              <Stack spacing={2}>
                {data.risks?.map((risk, idx) => (
                  <Paper key={idx} sx={{ p: 2, border: '1px solid' }}>
                    <Box
                      sx={{
                        display: 'flex',
                        gap: 1,
                        alignItems: 'start',
                        mb: 1,
                      }}
                    >
                      <Chip
                        label={risk.severity}
                        size="small"
                        color={getRiskColor(risk.severity)}
                        variant="outlined"
                      />
                      <Typography variant="subtitle2">
                        {risk.category}
                      </Typography>
                    </Box>
                    <Typography variant="body2">
                      {risk.description}
                    </Typography>
                  </Paper>
                ))}
              </Stack>
            </Box>

            {/* Recommendations */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Recommendations
              </Typography>
              <Stack spacing={1} component="ul" sx={{ pl: 2 }}>
                {data.recommendations?.map((rec, idx) => (
                  <Typography component="li" key={idx} variant="body2">
                    {rec}
                  </Typography>
                ))}
              </Stack>
            </Box>

            {/* File Info */}
            {data.uploaded_file && (
              <Typography variant="caption" color="textSecondary">
                File: {data.uploaded_file}
              </Typography>
            )}
          </Stack>
        </CardContent>
      </Card>
    );
  }

  // Spend Analysis Report
  if (type === 'spend') {
    return (
      <Card sx={{ bgcolor: 'background.paper' }}>
        <CardHeader
          title={title}
          subheader={`Created: ${formatDate(data.created_at)}`}
        />
        <CardContent>
          <Stack spacing={3}>
            {/* Key Metrics */}
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.light' }}>
                  <Typography variant="caption" color="textSecondary">
                    Total Spend
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {formatCurrency(data.total_spend)}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Paper
                  sx={{
                    p: 2,
                    textAlign: 'center',
                    bgcolor: 'success.light',
                  }}
                >
                  <Typography variant="caption" color="textSecondary">
                    Savings Identified
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {formatCurrency(data.savings_estimate)}
                  </Typography>
                </Paper>
              </Grid>
              {data.metrics?.transaction_count && (
                <Grid item xs={6} sm={3}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'info.light' }}>
                    <Typography variant="caption" color="textSecondary">
                      Transactions
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {data.metrics.transaction_count}
                    </Typography>
                  </Paper>
                </Grid>
              )}
            </Grid>

            <Divider />

            {/* Executive Summary */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Executive Summary
              </Typography>
              <Paper sx={{ p: 2, bgcolor: 'info.light' }}>
                <Typography>{data.executive_summary}</Typography>
              </Paper>
            </Box>

            {/* Savings Opportunities */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Savings Opportunities
              </Typography>
              <Stack spacing={2}>
                {data.savings_opportunities?.map((opp, idx) => (
                  <Paper key={idx} sx={{ p: 2 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        mb: 1,
                      }}
                    >
                      <Typography variant="subtitle2">
                        {opp.category}
                      </Typography>
                      <Typography
                        variant="subtitle2"
                        sx={{ color: 'success.main', fontWeight: 'bold' }}
                      >
                        {formatCurrency(opp.estimated_savings)}
                      </Typography>
                    </Box>
                    <Typography variant="body2">
                      {opp.description}
                    </Typography>
                  </Paper>
                ))}
              </Stack>
            </Box>

            {/* Recommendations */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Recommendations
              </Typography>
              <Stack spacing={1} component="ul" sx={{ pl: 2 }}>
                {data.recommendations?.map((rec, idx) => (
                  <Typography component="li" key={idx} variant="body2">
                    {rec}
                  </Typography>
                ))}
              </Stack>
            </Box>

            {/* File Info */}
            {data.uploaded_file && (
              <Typography variant="caption" color="textSecondary">
                File: {data.uploaded_file}
              </Typography>
            )}
          </Stack>
        </CardContent>
      </Card>
    );
  }

  // Default
  return <Card><CardContent><Typography>Unknown report type</Typography></CardContent></Card>;
}

export default ReportViewer;
