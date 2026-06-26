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
  Grid,
  Stack,
  Divider,
  Button,
  LinearProgress,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  PictureAsPdf as PdfIcon,
  EmojiEvents as TrophyIcon,
  AttachMoney as MoneyIcon,
  Savings as SavingsIcon,
} from '@mui/icons-material';

function ReportViewer({ title, type, data }) {
  if (!data) {
    return (
      <Card>
        <CardContent sx={{ py: 6, textAlign: 'center' }}>
          <Typography color="text.secondary">No data available</Typography>
        </CardContent>
      </Card>
    );
  }

  const getRiskColor = (level) => {
    const l = level?.toLowerCase() || 'medium';
    if (l === 'low') return 'success';
    if (l === 'high') return 'error';
    return 'warning';
  };

  const getRiskIcon = (level) => {
    const l = level?.toLowerCase() || 'medium';
    if (l === 'low') return <CheckCircleIcon fontSize="small" />;
    if (l === 'high') return <ErrorIcon fontSize="small" />;
    return <WarningIcon fontSize="small" />;
  };

  const getRiskBorderColor = (level) => {
    const l = level?.toLowerCase() || 'medium';
    if (l === 'low' || l === 'low risk') return '#10B981';
    if (l === 'high' || l === 'high risk') return '#EF4444';
    return '#F59E0B';
  };

  const formatCurrency = (value) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

  const SectionLabel = ({ children }) => (
    <Typography
      variant="caption"
      sx={{
        display: 'block',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        color: 'text.secondary',
        mb: 1.5,
      }}
    >
      {children}
    </Typography>
  );

  const SummaryBox = ({ children }) => (
    <Box
      sx={{
        p: 2.5,
        borderRadius: '10px',
        border: '1px solid #BFDBFE',
        backgroundColor: '#EFF6FF',
        color: '#1E40AF',
        lineHeight: 1.7,
        fontSize: '0.9rem',
      }}
    >
      {children}
    </Box>
  );

  const PdfButton = ({ id, reportType }) =>
    id ? (
      <Button
        component="a"
        href={`/api/reports/${reportType}/${id}/pdf`}
        target="_blank"
        rel="noopener noreferrer"
        size="small"
        startIcon={<PdfIcon fontSize="small" />}
        variant="outlined"
        sx={{ flexShrink: 0 }}
      >
        Export PDF
      </Button>
    ) : null;

  // ── Supplier Analysis ──────────────────────────────────────────────────────
  if (type === 'supplier') {
    return (
      <Card>
        <CardHeader
          title={title}
          subheader={`Generated ${formatDate(data.created_at)}`}
          action={<PdfButton id={data?.id} reportType={type} />}
        />
        <Divider />
        <CardContent>
          <Stack spacing={4}>
            {/* Executive Summary */}
            <Box>
              <SectionLabel>Executive Summary</SectionLabel>
              <SummaryBox>{data.executive_summary}</SummaryBox>
            </Box>

            {/* Recommended Supplier */}
            <Box>
              <SectionLabel>Recommended Supplier</SectionLabel>
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1.5,
                  px: 2.5,
                  py: 1.5,
                  borderRadius: '10px',
                  border: '1px solid',
                  borderColor: 'success.light',
                  backgroundColor: 'success.light',
                }}
              >
                <TrophyIcon sx={{ color: '#D97706', fontSize: 22 }} />
                <Typography variant="subtitle1" color="success.dark">
                  {data.recommended_supplier}
                </Typography>
              </Box>
            </Box>

            {/* Supplier Rankings */}
            <Box>
              <SectionLabel>Supplier Rankings</SectionLabel>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell width={48}>Rank</TableCell>
                      <TableCell>Supplier</TableCell>
                      <TableCell width={180}>Score</TableCell>
                      <TableCell>Highlights</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.supplier_scores?.map((supplier, idx) => {
                      const isWinner = supplier.supplier_name === data.recommended_supplier;
                      return (
                        <TableRow
                          key={idx}
                          sx={{
                            backgroundColor: isWinner ? '#ECFDF5' : 'inherit',
                            '&:last-child td': { borderBottom: 'none' },
                          }}
                        >
                          <TableCell>
                            <Box
                              sx={{
                                width: 24,
                                height: 24,
                                borderRadius: '50%',
                                backgroundColor: isWinner ? 'success.main' : '#E2E8F0',
                                color: isWinner ? 'white' : 'text.secondary',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                              }}
                            >
                              {supplier.rank}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={isWinner ? 600 : 400}>
                              {supplier.supplier_name}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <LinearProgress
                                variant="determinate"
                                value={Math.min(supplier.score, 100)}
                                color={isWinner ? 'success' : 'primary'}
                                sx={{ flex: 1, height: 6 }}
                              />
                              <Typography
                                variant="caption"
                                fontWeight={600}
                                sx={{ minWidth: 32, color: isWinner ? 'success.dark' : 'text.primary' }}
                              >
                                {supplier.score}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" color="text.secondary">
                              {supplier.highlights?.join(' · ') || '—'}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>

            {/* Analysis Reasoning */}
            <Box>
              <SectionLabel>Analysis Reasoning</SectionLabel>
              <Box
                sx={{
                  p: 2.5,
                  borderRadius: '10px',
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: '#FAFAFA',
                }}
              >
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', color: 'text.secondary', lineHeight: 1.7 }}>
                  {data.reasoning}
                </Typography>
              </Box>
            </Box>

            {/* Files analyzed */}
            {data.uploaded_files?.length > 0 && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
                <Typography variant="caption" color="text.secondary" fontWeight={500}>
                  Files analyzed:
                </Typography>
                {data.uploaded_files.map((f) => (
                  <Chip key={f} label={f} size="small" variant="outlined" />
                ))}
              </Box>
            )}
          </Stack>
        </CardContent>
      </Card>
    );
  }

  // ── Contract Review ────────────────────────────────────────────────────────
  if (type === 'contract') {
    const riskColor = getRiskColor(data.risk_level);
    return (
      <Card>
        <CardHeader
          title={title}
          subheader={`Generated ${formatDate(data.created_at)}`}
          action={<PdfButton id={data?.id} reportType={type} />}
        />
        <Divider />
        <CardContent>
          <Stack spacing={4}>
            {/* Risk Level */}
            <Box>
              <SectionLabel>Overall Risk Level</SectionLabel>
              <Chip
                icon={getRiskIcon(data.risk_level)}
                label={`${data.risk_level} Risk`}
                color={riskColor}
                sx={{ fontSize: '0.875rem', py: 2.5, px: 1, fontWeight: 600 }}
              />
            </Box>

            {/* Executive Summary */}
            <Box>
              <SectionLabel>Executive Summary</SectionLabel>
              <SummaryBox>{data.executive_summary}</SummaryBox>
            </Box>

            {/* Identified Risks */}
            {data.risks?.length > 0 && (
              <Box>
                <SectionLabel>Identified Risks ({data.risks.length})</SectionLabel>
                <Stack spacing={1.5}>
                  {data.risks.map((risk, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        p: 2.5,
                        borderRadius: '10px',
                        border: '1px solid',
                        borderLeft: '4px solid',
                        borderColor: 'divider',
                        borderLeftColor: getRiskBorderColor(risk.severity),
                        bgcolor: 'background.paper',
                      }}
                    >
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
                        <Chip
                          label={risk.severity}
                          size="small"
                          color={getRiskColor(risk.severity)}
                          sx={{ fontWeight: 600 }}
                        />
                        <Typography variant="subtitle2">{risk.category}</Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                        {risk.description}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Box>
            )}

            {/* Recommendations */}
            {data.recommendations?.length > 0 && (
              <Box>
                <SectionLabel>Recommendations</SectionLabel>
                <Stack spacing={1}>
                  {data.recommendations.map((rec, idx) => (
                    <Box
                      key={idx}
                      sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}
                    >
                      <Box
                        sx={{
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          backgroundColor: 'primary.light',
                          color: 'primary.main',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          flexShrink: 0,
                          mt: 0.15,
                        }}
                      >
                        {idx + 1}
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                        {rec}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Box>
            )}

            {data.uploaded_file && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={500}>
                  File analyzed:
                </Typography>
                <Chip label={data.uploaded_file} size="small" variant="outlined" />
              </Box>
            )}
          </Stack>
        </CardContent>
      </Card>
    );
  }

  // ── Spend Analysis ─────────────────────────────────────────────────────────
  if (type === 'spend') {
    return (
      <Card>
        <CardHeader
          title={title}
          subheader={`Generated ${formatDate(data.created_at)}`}
          action={<PdfButton id={data?.id} reportType={type} />}
        />
        <Divider />
        <CardContent>
          <Stack spacing={4}>
            {/* Key Metrics */}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Box
                  sx={{
                    p: 3,
                    borderRadius: '10px',
                    border: '1px solid #BFDBFE',
                    backgroundColor: '#EFF6FF',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <MoneyIcon sx={{ color: '#3B82F6', fontSize: 20 }} />
                    <Typography variant="caption" fontWeight={600} color="#1E40AF" sx={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Total Spend Analyzed
                    </Typography>
                  </Box>
                  <Typography variant="h5" fontWeight={700} color="#1E3A8A">
                    {formatCurrency(data.total_spend)}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box
                  sx={{
                    p: 3,
                    borderRadius: '10px',
                    border: '1px solid #A7F3D0',
                    backgroundColor: '#ECFDF5',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <SavingsIcon sx={{ color: '#10B981', fontSize: 20 }} />
                    <Typography variant="caption" fontWeight={600} color="#065F46" sx={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Savings Identified
                    </Typography>
                  </Box>
                  <Typography variant="h5" fontWeight={700} color="#064E3B">
                    {formatCurrency(data.savings_estimate)}
                  </Typography>
                </Box>
              </Grid>
              {data.metrics?.transaction_count && (
                <Grid item xs={12} sm={6}>
                  <Box
                    sx={{
                      p: 3,
                      borderRadius: '10px',
                      border: '1px solid #E2E8F0',
                      backgroundColor: '#F8FAFC',
                    }}
                  >
                    <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', mb: 1 }}>
                      Transactions
                    </Typography>
                    <Typography variant="h5" fontWeight={700}>
                      {data.metrics.transaction_count.toLocaleString()}
                    </Typography>
                  </Box>
                </Grid>
              )}
            </Grid>

            {/* Executive Summary */}
            <Box>
              <SectionLabel>Executive Summary</SectionLabel>
              <SummaryBox>{data.executive_summary}</SummaryBox>
            </Box>

            {/* Savings Opportunities */}
            {data.savings_opportunities?.length > 0 && (
              <Box>
                <SectionLabel>Savings Opportunities ({data.savings_opportunities.length})</SectionLabel>
                <Stack spacing={1.5}>
                  {data.savings_opportunities.map((opp, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        p: 2.5,
                        borderRadius: '10px',
                        border: '1px solid',
                        borderLeft: '4px solid #10B981',
                        borderColor: 'divider',
                        borderLeftColor: '#10B981',
                        bgcolor: 'background.paper',
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          mb: 0.75,
                        }}
                      >
                        <Typography variant="subtitle2">{opp.category}</Typography>
                        <Chip
                          label={formatCurrency(opp.estimated_savings)}
                          size="small"
                          sx={{
                            backgroundColor: '#D1FAE5',
                            color: '#065F46',
                            fontWeight: 700,
                            fontSize: '0.75rem',
                          }}
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                        {opp.description}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Box>
            )}

            {/* Recommendations */}
            {data.recommendations?.length > 0 && (
              <Box>
                <SectionLabel>Recommendations</SectionLabel>
                <Stack spacing={1}>
                  {data.recommendations.map((rec, idx) => (
                    <Box
                      key={idx}
                      sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}
                    >
                      <Box
                        sx={{
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          backgroundColor: '#D1FAE5',
                          color: '#065F46',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          flexShrink: 0,
                          mt: 0.15,
                        }}
                      >
                        {idx + 1}
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                        {rec}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Box>
            )}

            {data.uploaded_file && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={500}>
                  File analyzed:
                </Typography>
                <Chip label={data.uploaded_file} size="small" variant="outlined" />
              </Box>
            )}
          </Stack>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography color="text.secondary">Unknown report type</Typography>
      </CardContent>
    </Card>
  );
}

export default ReportViewer;
