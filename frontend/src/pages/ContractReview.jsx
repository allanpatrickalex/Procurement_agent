import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Alert,
  Grid,
  Card,
  CardContent,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  ShieldOutlined as ShieldIcon,
  CheckCircle as CheckIcon,
  Refresh as NewIcon,
} from '@mui/icons-material';
import { analyzeContract } from '../services/api';
import FileUpload from '../components/FileUpload';
import ReportViewer from '../components/ReportViewer';

const CHECKS = [
  'Auto-renewal and contract renewal dates',
  'Annual price escalation and CPI clauses',
  'Vendor lock-in and exit restrictions',
  'Missing or weak SLA language',
  'Penalty, liability, and indemnification clauses',
  'Payment terms and early termination fees',
];

function ContractReview() {
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);

  const handleUpload = async (files) => {
    setError(null);
    setReport(null);
    if (!files || files.length === 0) {
      throw new Error('Please select a contract PDF');
    }
    const formData = new FormData();
    formData.append('file', files[0]);
    const result = await analyzeContract(formData);
    setReport(result);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      {/* Page Header */}
      <Box sx={{ mb: 5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '10px',
              backgroundColor: 'info.light',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <ShieldIcon sx={{ color: 'info.main', fontSize: 20 }} />
          </Box>
          <Typography variant="h4">Contract Review</Typography>
        </Box>
        <Typography variant="body1" color="text.secondary" sx={{ ml: 6.5 }}>
          Upload a supplier contract PDF. Our AI identifies commercial risks, flags problematic
          clauses, and provides actionable recommendations.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {!report ? (
        <Grid container spacing={3} alignItems="flex-start">
          {/* Upload Card */}
          <Grid item xs={12} md={7}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography
                  variant="caption"
                  fontWeight={600}
                  sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary', display: 'block', mb: 2 }}
                >
                  Upload Contract PDF
                </Typography>
                <FileUpload
                  accept=".pdf"
                  label="Select Contract PDF"
                  onUpload={handleUpload}
                  multiple={false}
                  maxSize={50}
                />
              </CardContent>
            </Card>
          </Grid>

          {/* Checks Card */}
          <Grid item xs={12} md={5}>
            <Card sx={{ backgroundColor: '#FAFAFA' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography
                  variant="caption"
                  fontWeight={600}
                  sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary', display: 'block', mb: 2 }}
                >
                  Risk Assessment Includes
                </Typography>
                <List dense disablePadding>
                  {CHECKS.map((check, idx) => (
                    <ListItem key={idx} disableGutters sx={{ py: 0.75, alignItems: 'flex-start' }}>
                      <ListItemIcon sx={{ minWidth: 28, mt: 0.25 }}>
                        <CheckIcon sx={{ fontSize: 16, color: 'info.main' }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={check}
                        primaryTypographyProps={{ variant: 'body2', color: 'text.secondary', lineHeight: 1.5 }}
                      />
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
            <Typography variant="h5">Risk Assessment Report</Typography>
            <Button
              size="small"
              startIcon={<NewIcon />}
              variant="outlined"
              onClick={() => { setReport(null); setError(null); }}
              sx={{ ml: 'auto' }}
            >
              New Review
            </Button>
          </Box>
          <ReportViewer
            title={`Contract Review Report #${report.id}`}
            type="contract"
            data={report}
          />
        </Box>
      )}
    </Container>
  );
}

export default ContractReview;
