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
  Stack,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  LocalShipping as SupplierIcon,
  Refresh as NewIcon,
} from '@mui/icons-material';
import { analyzeSuppliers } from '../services/api';
import FileUpload from '../components/FileUpload';
import ReportViewer from '../components/ReportViewer';

const TIPS = [
  'Upload at least 2 supplier quote PDFs to compare',
  'Ensure each PDF clearly shows the supplier name, pricing, and terms',
  'AI evaluates cost, lead time, warranty, and payment terms',
  "You'll receive a ranked scorecard and a recommended supplier",
  'Each file should be under 50MB',
];

function SupplierAnalysis() {
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);

  const handleUpload = async (files) => {
    setError(null);
    setReport(null);
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    const result = await analyzeSuppliers(formData);
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
              backgroundColor: 'primary.light',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <SupplierIcon sx={{ color: 'primary.main', fontSize: 20 }} />
          </Box>
          <Typography variant="h4">Supplier Quote Analysis</Typography>
        </Box>
        <Typography variant="body1" color="text.secondary" sx={{ ml: 6.5 }}>
          Upload two or more supplier quote PDFs. Our AI ranks them and recommends the best
          supplier based on cost, delivery, warranty, and payment terms.
        </Typography>
      </Box>

      {/* Global error */}
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
                  Upload Quote PDFs
                </Typography>
                <FileUpload
                  accept=".pdf"
                  label="Select Quote PDFs"
                  onUpload={handleUpload}
                  multiple={true}
                  maxSize={50}
                />
              </CardContent>
            </Card>
          </Grid>

          {/* Tips Card */}
          <Grid item xs={12} md={5}>
            <Card sx={{ backgroundColor: '#FAFAFA' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography
                  variant="caption"
                  fontWeight={600}
                  sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary', display: 'block', mb: 2 }}
                >
                  What to Expect
                </Typography>
                <List dense disablePadding>
                  {TIPS.map((tip, idx) => (
                    <ListItem key={idx} disableGutters sx={{ py: 0.75, alignItems: 'flex-start' }}>
                      <ListItemIcon sx={{ minWidth: 28, mt: 0.25 }}>
                        <CheckIcon sx={{ fontSize: 16, color: 'success.main' }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={tip}
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
            <Typography variant="h5">Analysis Report</Typography>
            <Button
              size="small"
              startIcon={<NewIcon />}
              variant="outlined"
              onClick={() => { setReport(null); setError(null); }}
              sx={{ ml: 'auto' }}
            >
              New Analysis
            </Button>
          </Box>
          <ReportViewer
            title={`Supplier Analysis Report #${report.id}`}
            type="supplier"
            data={report}
          />
        </Box>
      )}
    </Container>
  );
}

export default SupplierAnalysis;
