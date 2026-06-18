import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Alert,
  Stack,
} from '@mui/material';
import { analyzeSpend } from '../services/api';
import FileUpload from '../components/FileUpload';
import ReportViewer from '../components/ReportViewer';

/**
 * Spend analysis page — upload CSV spend data for savings analysis.
 */
function SpendAnalysis() {
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);

  const handleUpload = async (files) => {
    try {
      setError(null);
      setReport(null);

      if (!files || files.length === 0) {
        setError('Please select a spend CSV file');
        return;
      }

      const formData = new FormData();
      formData.append('file', files[0]);

      const result = await analyzeSpend(formData);
      setReport(result);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
        Spend Analysis
      </Typography>
      <Typography variant="body1" color="textSecondary" sx={{ mb: 4 }}>
        Upload your procurement spend data as a CSV file. Our AI will analyze
        your spending patterns and identify cost reduction and vendor
        consolidation opportunities.
      </Typography>

      <Stack spacing={4}>
        {/* File Upload Section */}
        <Box>
          <Typography variant="h6" gutterBottom>
            Upload Spend CSV
          </Typography>
          <FileUpload
            accept=".csv"
            label="Select Spend CSV"
            onUpload={handleUpload}
            multiple={false}
            maxSize={50}
          />
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Report Display */}
        {report && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Spend Analysis Report
            </Typography>
            <ReportViewer
              title={`Spend Analysis Report #${report.id}`}
              type="spend"
              data={report}
            />
          </Box>
        )}

        {/* Guidelines */}
        {!report && (
          <Alert severity="info">
            <Typography variant="subtitle2" gutterBottom>
              CSV Format Requirements:
            </Typography>
            <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
              <li>
                <strong>Required columns:</strong> Vendor (or Supplier), Category,
                Amount (or Spend)
              </li>
              <li>
                <strong>Optional:</strong> Date, Transaction Date, Invoice Date
              </li>
              <li>Amount column must contain numeric values</li>
              <li>First row should contain column headers</li>
              <li>CSV file should be under 50MB</li>
            </ul>
            <Typography variant="caption" sx={{ mt: 2, display: 'block' }}>
              <strong>Example:</strong> Vendor, Category, Amount, Date
            </Typography>
            <Typography variant="caption" sx={{ display: 'block' }}>
              Dell, IT Equipment, 25000, 2024-01-15
            </Typography>
            <Typography variant="caption" sx={{ display: 'block' }}>
              HP, IT Equipment, 18000, 2024-01-16
            </Typography>
          </Alert>
        )}
      </Stack>
    </Container>
  );
}

export default SpendAnalysis;
