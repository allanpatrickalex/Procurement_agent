import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Alert,
  Stack,
} from '@mui/material';
import { analyzeContract } from '../services/api';
import FileUpload from '../components/FileUpload';
import ReportViewer from '../components/ReportViewer';

/**
 * Contract review page — upload a supplier contract for risk analysis.
 */
function ContractReview() {
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);

  const handleUpload = async (files) => {
    try {
      setError(null);
      setReport(null);

      if (!files || files.length === 0) {
        setError('Please select a contract PDF');
        return;
      }

      const formData = new FormData();
      formData.append('file', files[0]);

      const result = await analyzeContract(formData);
      setReport(result);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
        Contract Review
      </Typography>
      <Typography variant="body1" color="textSecondary" sx={{ mb: 4 }}>
        Upload a supplier contract PDF. Our AI will analyze it for commercial
        risks including auto-renewal clauses, vendor lock-in, price escalations,
        and missing SLA language.
      </Typography>

      <Stack spacing={4}>
        {/* File Upload Section */}
        <Box>
          <Typography variant="h6" gutterBottom>
            Upload Contract PDF
          </Typography>
          <FileUpload
            accept=".pdf"
            label="Select Contract PDF"
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
              Risk Assessment Report
            </Typography>
            <ReportViewer
              title={`Contract Review Report #${report.id}`}
              type="contract"
              data={report}
            />
          </Box>
        )}

        {/* Guidelines */}
        {!report && (
          <Alert severity="info">
            <Typography variant="subtitle2" gutterBottom>
              Risk Assessment Includes:
            </Typography>
            <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
              <li>Auto-renewal and renewal date tracking</li>
              <li>Price escalation clauses and annual increases</li>
              <li>Vendor lock-in and termination restrictions</li>
              <li>Missing SLA and service level requirements</li>
              <li>Penalty clauses and liability limitations</li>
              <li>Payment terms and conditions</li>
            </ul>
          </Alert>
        )}
      </Stack>
    </Container>
  );
}

export default ContractReview;
