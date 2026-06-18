import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Alert,
  Stack,
} from '@mui/material';
import { analyzeSuppliers } from '../services/api';
import FileUpload from '../components/FileUpload';
import ReportViewer from '../components/ReportViewer';

/**
 * Supplier quote analysis page — upload multiple supplier quotes for comparison.
 */
function SupplierAnalysis() {
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);

  const handleUpload = async (files) => {
    try {
      setError(null);
      setReport(null);

      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files', file);
      });

      const result = await analyzeSuppliers(formData);
      setReport(result);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
        Supplier Quote Analysis
      </Typography>
      <Typography variant="body1" color="textSecondary" sx={{ mb: 4 }}>
        Upload two or more supplier quotation PDFs. Our AI will compare them and
        recommend the best supplier based on cost, delivery time, warranty, and
        payment terms.
      </Typography>

      <Stack spacing={4}>
        {/* File Upload Section */}
        <Box>
          <Typography variant="h6" gutterBottom>
            Upload Quote PDFs
          </Typography>
          <FileUpload
            accept=".pdf"
            label="Select Quote PDFs"
            onUpload={handleUpload}
            multiple={true}
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
              Analysis Report
            </Typography>
            <ReportViewer
              title={`Supplier Analysis Report #${report.id}`}
              type="supplier"
              data={report}
            />
          </Box>
        )}

        {/* Guidelines */}
        {!report && (
          <Alert severity="info">
            <Typography variant="subtitle2" gutterBottom>
              Tips for Best Results:
            </Typography>
            <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
              <li>Upload at least 2 supplier quotes</li>
              <li>Use PDF format for best text extraction</li>
              <li>Ensure quotes clearly show supplier name, price, and terms</li>
              <li>Each file should be under 50MB</li>
            </ul>
          </Alert>
        )}
      </Stack>
    </Container>
  );
}

export default SupplierAnalysis;
