import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Alert,
  TextField,
  Tabs,
  Tab,
  Stack,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Handshake as NegotiateIcon,
  Article as RfpIcon,
  Send as SendIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Email as EmailIcon,
} from '@mui/icons-material';
import { generateNegotiation, generateRfp } from '../services/api';

const PRIORITY_COLOR = { High: 'error', Medium: 'warning', Low: 'info' };

function Sourcing() {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Negotiation state
  const [negContext, setNegContext] = useState('');
  const [negResult, setNegResult] = useState(null);

  // RFP state
  const [rfpDescription, setRfpDescription] = useState('');
  const [rfpResult, setRfpResult] = useState(null);

  const handleNegotiate = async () => {
    if (!negContext.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const result = await generateNegotiation(negContext);
      setNegResult(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateRfp = async () => {
    if (!rfpDescription.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const result = await generateRfp(rfpDescription);
      setRfpResult(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      <Box sx={{ mb: 5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <Box sx={{ width: 36, height: 36, borderRadius: '10px', background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <NegotiateIcon sx={{ color: 'white', fontSize: 20 }} />
          </Box>
          <Typography variant="h4">Sourcing Assistant</Typography>
        </Box>
        <Typography variant="body1" color="text.secondary" sx={{ ml: 6.5 }}>
          Generate negotiation strategies with ready-to-send supplier emails, or create professional RFP documents.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab icon={<NegotiateIcon />} iconPosition="start" label="Negotiate" />
        <Tab icon={<RfpIcon />} iconPosition="start" label="Generate RFP" />
      </Tabs>

      {tab === 0 && (
        <Box>
          {!negResult ? (
            <Grid container spacing={3} alignItems="flex-start">
              <Grid item xs={12} md={7}>
                <Card>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="caption" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary', display: 'block', mb: 2 }}>
                      Describe the Negotiation
                    </Typography>
                    <TextField
                      multiline
                      rows={8}
                      fullWidth
                      placeholder="Describe the contract, supplier, or situation you need to negotiate. Include any details about current pricing, term length, volumes, pain points, and your alternatives. The more context, the stronger the strategy."
                      value={negContext}
                      onChange={(e) => setNegContext(e.target.value)}
                      sx={{ mb: 2 }}
                    />
                    <Button
                      variant="contained"
                      onClick={handleNegotiate}
                      disabled={loading || !negContext.trim()}
                      startIcon={<NegotiateIcon />}
                      fullWidth
                    >
                      {loading ? 'Generating strategy…' : 'Generate Negotiation Strategy'}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={5}>
                <Card sx={{ backgroundColor: '#FAFAFA' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="caption" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary', display: 'block', mb: 2 }}>
                      What You Get
                    </Typography>
                    <List dense disablePadding>
                      {[
                        'Negotiation levers ranked by impact',
                        'Target price with reduction rationale',
                        'BATNA and walk-away point',
                        'Ready-to-send supplier email draft',
                        'Key talking points and red flags',
                      ].map((item, i) => (
                        <ListItem key={i} disableGutters sx={{ py: 0.75, alignItems: 'flex-start' }}>
                          <ListItemIcon sx={{ minWidth: 28, mt: 0.25 }}>
                            <CheckIcon sx={{ fontSize: 16, color: 'success.main' }} />
                          </ListItemIcon>
                          <ListItemText primary={item} primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }} />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          ) : (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5">Negotiation Strategy</Typography>
                <Button size="small" variant="outlined" onClick={() => setNegResult(null)} sx={{ ml: 'auto' }}>
                  New Strategy
                </Button>
              </Box>
              <NegotiationReport result={negResult} />
            </Box>
          )}
        </Box>
      )}

      {tab === 1 && (
        <Box>
          {!rfpResult ? (
            <Grid container spacing={3} alignItems="flex-start">
              <Grid item xs={12} md={7}>
                <Card>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="caption" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary', display: 'block', mb: 2 }}>
                      Describe Your Procurement Need
                    </Typography>
                    <TextField
                      multiline
                      rows={8}
                      fullWidth
                      placeholder="Describe what you need to procure. Include: the product or service category, estimated volume/budget, technical requirements, timeline, vendor qualifications you need, and any special considerations."
                      value={rfpDescription}
                      onChange={(e) => setRfpDescription(e.target.value)}
                      sx={{ mb: 2 }}
                    />
                    <Button
                      variant="contained"
                      onClick={handleGenerateRfp}
                      disabled={loading || !rfpDescription.trim()}
                      startIcon={<RfpIcon />}
                      fullWidth
                    >
                      {loading ? 'Generating RFP…' : 'Generate RFP Document'}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={5}>
                <Card sx={{ backgroundColor: '#FAFAFA' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="caption" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary', display: 'block', mb: 2 }}>
                      RFP Includes
                    </Typography>
                    <List dense disablePadding>
                      {[
                        'Professional scope of work sections',
                        'Weighted evaluation criteria',
                        'Scoring matrix for vendor comparison',
                        'Required documents checklist',
                        'Project timeline with milestones',
                      ].map((item, i) => (
                        <ListItem key={i} disableGutters sx={{ py: 0.75, alignItems: 'flex-start' }}>
                          <ListItemIcon sx={{ minWidth: 28, mt: 0.25 }}>
                            <CheckIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                          </ListItemIcon>
                          <ListItemText primary={item} primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }} />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          ) : (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5">{rfpResult.rfp_title}</Typography>
                <Button size="small" variant="outlined" onClick={() => setRfpResult(null)} sx={{ ml: 'auto' }}>
                  New RFP
                </Button>
              </Box>
              <RfpReport result={rfpResult} />
            </Box>
          )}
        </Box>
      )}
    </Container>
  );
}

function SectionLabel({ children }) {
  return (
    <Typography variant="caption" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary', display: 'block', mb: 1.5 }}>
      {children}
    </Typography>
  );
}

function NegotiationReport({ result }) {
  return (
    <Stack spacing={3}>
      {/* Executive summary */}
      <Card>
        <CardContent sx={{ p: 3 }}>
          <SectionLabel>Executive Summary</SectionLabel>
          <Box sx={{ p: 2, backgroundColor: '#EFF6FF', borderRadius: '8px', border: '1px solid #BFDBFE' }}>
            <Typography variant="body2" color="#1E40AF" lineHeight={1.7}>{result.executive_summary}</Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Target price */}
      {result.target_price && (
        <Card>
          <CardContent sx={{ p: 3 }}>
            <SectionLabel>Target Price</SectionLabel>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#FEF2F2', borderRadius: '8px' }}>
                  <Typography variant="caption" color="text.secondary">Current</Typography>
                  <Typography variant="h6" fontWeight={700} color="error.main">
                    {result.target_price.current_value > 0 ? `$${result.target_price.current_value.toLocaleString()}` : '—'}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#ECFDF5', borderRadius: '8px' }}>
                  <Typography variant="caption" color="text.secondary">Target</Typography>
                  <Typography variant="h6" fontWeight={700} color="success.main">
                    {result.target_price.target_value > 0 ? `$${result.target_price.target_value.toLocaleString()}` : '—'}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#F0FDF4', borderRadius: '8px' }}>
                  <Typography variant="caption" color="text.secondary">Reduction</Typography>
                  <Typography variant="h6" fontWeight={700} color="success.dark">
                    {result.target_price.reduction_percent > 0 ? `${result.target_price.reduction_percent}%` : '—'}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
            {result.target_price.rationale && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>{result.target_price.rationale}</Typography>
            )}
          </CardContent>
        </Card>
      )}

      {/* Negotiation levers */}
      {result.negotiation_levers?.length > 0 && (
        <Card>
          <CardContent sx={{ p: 3 }}>
            <SectionLabel>Negotiation Levers</SectionLabel>
            <Stack spacing={2}>
              {result.negotiation_levers.map((lever, i) => (
                <Box key={i} sx={{ p: 2, borderLeft: '3px solid', borderColor: lever.priority === 'High' ? 'error.main' : lever.priority === 'Medium' ? 'warning.main' : 'info.main', backgroundColor: '#FAFAFA', borderRadius: '0 8px 8px 0' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Typography variant="subtitle2">{lever.lever}</Typography>
                    <Chip label={lever.priority} size="small" color={PRIORITY_COLOR[lever.priority] || 'info'} sx={{ fontWeight: 600, fontSize: '0.7rem' }} />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>{lever.description}</Typography>
                  <Typography variant="body2" fontWeight={500} color="success.dark">Impact: {lever.potential_impact}</Typography>
                </Box>
              ))}
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* BATNA / positions */}
      <Grid container spacing={3}>
        {result.batna && (
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <SectionLabel>BATNA</SectionLabel>
                <Typography variant="body2" color="text.secondary">{result.batna}</Typography>
              </CardContent>
            </Card>
          </Grid>
        )}
        {result.opening_position && (
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <SectionLabel>Opening Position</SectionLabel>
                <Typography variant="body2" color="text.secondary">{result.opening_position}</Typography>
              </CardContent>
            </Card>
          </Grid>
        )}
        {result.walk_away_point && (
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', borderColor: 'error.light' }}>
              <CardContent sx={{ p: 3 }}>
                <SectionLabel>Walk Away Point</SectionLabel>
                <Typography variant="body2" color="error.main">{result.walk_away_point}</Typography>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Supplier email */}
      {result.supplier_email && (
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <EmailIcon sx={{ color: 'primary.main', fontSize: 18 }} />
              <SectionLabel>Ready-to-Send Supplier Email</SectionLabel>
            </Box>
            <Box sx={{ p: 2, backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <Typography variant="caption" fontWeight={600} color="text.secondary">SUBJECT</Typography>
              <Typography variant="body2" fontWeight={500} sx={{ mb: 2 }}>{result.supplier_email.subject}</Typography>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{result.supplier_email.body}</Typography>
            </Box>
            <Button
              size="small"
              variant="outlined"
              sx={{ mt: 1.5 }}
              onClick={() => {
                navigator.clipboard.writeText(`Subject: ${result.supplier_email.subject}\n\n${result.supplier_email.body}`);
              }}
            >
              Copy to clipboard
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Red flags */}
      {result.red_flags?.length > 0 && (
        <Card sx={{ borderColor: 'error.light' }}>
          <CardContent sx={{ p: 3 }}>
            <SectionLabel>Red Flags to Watch</SectionLabel>
            <Stack spacing={1}>
              {result.red_flags.map((flag, i) => (
                <Box key={i} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                  <WarningIcon sx={{ color: 'error.main', fontSize: 16, mt: 0.25, flexShrink: 0 }} />
                  <Typography variant="body2" color="text.secondary">{flag}</Typography>
                </Box>
              ))}
            </Stack>
          </CardContent>
        </Card>
      )}
    </Stack>
  );
}

function RfpReport({ result }) {
  return (
    <Stack spacing={3}>
      {/* Executive summary */}
      <Card>
        <CardContent sx={{ p: 3 }}>
          <SectionLabel>Executive Summary</SectionLabel>
          <Box sx={{ p: 2, backgroundColor: '#EFF6FF', borderRadius: '8px', border: '1px solid #BFDBFE' }}>
            <Typography variant="body2" color="#1E40AF" lineHeight={1.7}>{result.executive_summary}</Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Sections */}
      {result.sections?.length > 0 && (
        <Card>
          <CardContent sx={{ p: 3 }}>
            <SectionLabel>RFP Sections</SectionLabel>
            <Stack spacing={2.5}>
              {result.sections.map((section, i) => (
                <Box key={i}>
                  {i > 0 && <Divider sx={{ mb: 2.5 }} />}
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>{section.title}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{section.content}</Typography>
                </Box>
              ))}
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Evaluation criteria */}
      {result.evaluation_criteria?.length > 0 && (
        <Card>
          <CardContent sx={{ p: 3 }}>
            <SectionLabel>Evaluation Criteria</SectionLabel>
            <Stack spacing={1.5}>
              {result.evaluation_criteria.map((c, i) => (
                <Box key={i} sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                  <Chip label={`${c.weight_percent}%`} size="small" color="primary" sx={{ fontWeight: 700, minWidth: 56, flexShrink: 0 }} />
                  <Box>
                    <Typography variant="subtitle2">{c.criterion}</Typography>
                    <Typography variant="body2" color="text.secondary">{c.description}</Typography>
                  </Box>
                </Box>
              ))}
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      {result.timeline?.length > 0 && (
        <Card>
          <CardContent sx={{ p: 3 }}>
            <SectionLabel>Timeline</SectionLabel>
            <Stack spacing={1.5}>
              {result.timeline.map((t, i) => (
                <Box key={i} sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                  <Chip label={`Wk ${t.weeks_from_now}`} size="small" variant="outlined" sx={{ minWidth: 56, flexShrink: 0 }} />
                  <Box>
                    <Typography variant="subtitle2">{t.milestone}</Typography>
                    <Typography variant="body2" color="text.secondary">{t.description}</Typography>
                  </Box>
                </Box>
              ))}
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Required documents */}
      {result.required_documents?.length > 0 && (
        <Card>
          <CardContent sx={{ p: 3 }}>
            <SectionLabel>Required Documents from Vendors</SectionLabel>
            <List dense disablePadding>
              {result.required_documents.map((doc, i) => (
                <ListItem key={i} disableGutters sx={{ py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 28 }}>
                    <CheckIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                  </ListItemIcon>
                  <ListItemText primary={doc} primaryTypographyProps={{ variant: 'body2' }} />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}
    </Stack>
  );
}

export default Sourcing;
