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
  Divider,
  Stack,
} from '@mui/material';
import {
  TrendingDown as SpendIcon,
  Refresh as NewIcon,
  TableChart as CsvIcon,
} from '@mui/icons-material';
import { analyzeSpendWithMapping } from '../services/api';
import MappingConfirmModal from '../components/MappingConfirmModal';
import FileUpload from '../components/FileUpload';
import ReportViewer from '../components/ReportViewer';

const CSV_FORMAT = [
  { label: 'Required columns', value: 'Vendor (or Supplier), Category, Amount (or Spend)' },
  { label: 'Optional columns', value: 'Date, Invoice Date, Transaction Date' },
  { label: 'Amount format', value: 'Numeric values only (no currency symbols)' },
  { label: 'First row', value: 'Must contain column headers' },
  { label: 'Max file size', value: '50 MB' },
];

function SpendAnalysis() {
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);
  const [mappingSuggestion, setMappingSuggestion] = useState(null);
  const [mappingModalOpen, setMappingModalOpen] = useState(false);
  const [selectedFileForAnalysis, setSelectedFileForAnalysis] = useState(null);

  const handleUpload = async (files) => {
    setError(null);
    setReport(null);
    if (!files || files.length === 0) {
      throw new Error('Please select a spend CSV file');
    }

    const formData = new FormData();
    formData.append('file', files[0]);
    setSelectedFileForAnalysis(files[0]);

    const mapResp = await fetch('/api/spend/map', {
      method: 'POST',
      body: formData,
    }).then((r) => r.json());

    setMappingSuggestion(mapResp);

    if ((mapResp.core_confidence || 0) < 0.8) {
      setMappingModalOpen(true);
      return;
    }

    const result = await analyzeSpendWithMapping(files[0], mapResp.mapping);
    setReport(result);
  };

  const handleConfirmMapping = async (mapping) => {
    setMappingModalOpen(false);
    try {
      const result = await analyzeSpendWithMapping(selectedFileForAnalysis, mapping);
      setReport(result);
    } catch (err) {
      setError(err.message || 'Spend analysis failed');
    }
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
              backgroundColor: 'success.light',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <SpendIcon sx={{ color: 'success.main', fontSize: 20 }} />
          </Box>
          <Typography variant="h4">Spend Analysis</Typography>
        </Box>
        <Typography variant="body1" color="text.secondary" sx={{ ml: 6.5 }}>
          Upload your procurement spend data as a CSV. Our AI identifies cost reduction
          opportunities, vendor consolidation targets, and overspending trends.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <MappingConfirmModal
        open={mappingModalOpen}
        suggestion={mappingSuggestion}
        onClose={() => setMappingModalOpen(false)}
        onConfirm={handleConfirmMapping}
      />

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
                  Upload Spend CSV
                </Typography>
                <FileUpload
                  accept=".csv"
                  label="Select Spend CSV"
                  onUpload={handleUpload}
                  multiple={false}
                  maxSize={50}
                />
              </CardContent>
            </Card>
          </Grid>

          {/* Format Guide Card */}
          <Grid item xs={12} md={5}>
            <Card sx={{ backgroundColor: '#FAFAFA' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography
                  variant="caption"
                  fontWeight={600}
                  sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary', display: 'block', mb: 2 }}
                >
                  CSV Format Guide
                </Typography>

                <Stack spacing={0}>
                  {CSV_FORMAT.map(({ label, value }, idx) => (
                    <Box key={idx}>
                      {idx > 0 && <Divider sx={{ my: 1.25 }} />}
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                        <Typography variant="caption" fontWeight={600} color="text.primary">
                          {label}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {value}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Stack>

                <Box
                  sx={{
                    mt: 2.5,
                    p: 2,
                    borderRadius: '8px',
                    backgroundColor: '#F1F5F9',
                    border: '1px solid #E2E8F0',
                  }}
                >
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
                    <CsvIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                    <Typography variant="caption" fontWeight={600} color="text.secondary">
                      Example Row
                    </Typography>
                  </Box>
                  <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary', fontSize: '0.7rem', display: 'block' }}>
                    Vendor, Category, Amount, Date
                  </Typography>
                  <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary', fontSize: '0.7rem', display: 'block' }}>
                    Dell, IT Equipment, 25000, 2024-01-15
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      ) : (
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5">Spend Analysis Report</Typography>
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
            title={`Spend Analysis Report #${report.id}`}
            type="spend"
            data={report}
          />
        </Box>
      )}
    </Container>
  );
}

export default SpendAnalysis;
