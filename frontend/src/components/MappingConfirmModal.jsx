import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Typography,
  Chip,
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Divider,
} from '@mui/material';
import { TableChart as TableIcon } from '@mui/icons-material';

const CANONICAL_FIELDS = [
  'vendor',
  'amount',
  'category',
  'date',
  'invoice_number',
  'purchase_order',
  'currency',
  'cost_center',
];

const FIELD_LABELS = {
  vendor: 'Vendor',
  amount: 'Amount',
  category: 'Category',
  date: 'Date',
  invoice_number: 'Invoice Number',
  purchase_order: 'Purchase Order',
  currency: 'Currency',
  cost_center: 'Cost Center',
};

const REQUIRED_FIELDS = new Set(['vendor', 'amount', 'category']);

function ConfidenceBadge({ value }) {
  const pct = Math.round((value || 0) * 100);
  let color = 'success';
  if (pct < 60) color = 'error';
  else if (pct < 90) color = 'warning';

  return (
    <Chip
      label={`${pct}%`}
      size="small"
      color={color}
      sx={{ fontWeight: 700, fontSize: '0.7rem', height: 20 }}
    />
  );
}

function MappingConfirmModal({ open, onClose, suggestion, onConfirm }) {
  const initial = suggestion?.mapping || {};
  const confidences = suggestion?.confidences || {};
  const [values, setValues] = useState(() => ({ ...initial }));

  React.useEffect(() => {
    setValues({ ...(suggestion?.mapping || {}) });
  }, [suggestion]);

  const handleChange = (field, val) => {
    setValues((v) => ({ ...v, [field]: val }));
  };

  return (
    <Dialog open={!!open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="h6">Confirm Column Mapping</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 400 }}>
          Review the detected column mapping before running the analysis.
        </Typography>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 3 }}>
        {/* Detected headers */}
        {suggestion?.headers?.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="caption"
              fontWeight={600}
              sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary', display: 'block', mb: 1 }}
            >
              Detected CSV Headers
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
              {suggestion.headers.map((h) => (
                <Chip key={h} label={h} size="small" variant="outlined" />
              ))}
            </Box>
          </Box>
        )}

        {/* Sample rows */}
        {suggestion?.sample_rows?.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="caption"
              fontWeight={600}
              sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary', display: 'block', mb: 1 }}
            >
              <TableIcon sx={{ fontSize: 12, mr: 0.5, verticalAlign: 'middle' }} />
              Sample Data
            </Typography>
            <TableContainer sx={{ maxHeight: 150, border: '1px solid', borderColor: 'divider', borderRadius: '8px' }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    {Object.keys(suggestion.sample_rows[0]).map((col) => (
                      <TableCell key={col}>{col}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {suggestion.sample_rows.map((row, idx) => (
                    <TableRow key={idx}>
                      {Object.keys(row).map((col) => (
                        <TableCell key={col}>{row[col]}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Field mappings */}
        <Typography
          variant="caption"
          fontWeight={600}
          sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary', display: 'block', mb: 2 }}
        >
          Column Mappings
        </Typography>
        <Grid container spacing={2}>
          {CANONICAL_FIELDS.map((field) => {
            const conf = confidences[field] || 0;
            const isRequired = REQUIRED_FIELDS.has(field);
            return (
              <Grid item xs={12} sm={6} key={field}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Typography variant="caption" fontWeight={600} color="text.primary">
                      {FIELD_LABELS[field]}
                    </Typography>
                    {isRequired && (
                      <Typography variant="caption" color="error.main" fontWeight={600}>
                        *
                      </Typography>
                    )}
                    {values[field] && <ConfidenceBadge value={conf} />}
                  </Box>
                  <TextField
                    value={values[field] || ''}
                    onChange={(e) => handleChange(field, e.target.value)}
                    fullWidth
                    placeholder={`Map to CSV column…`}
                    size="small"
                  />
                </Box>
              </Grid>
            );
          })}
        </Grid>

        <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
          * Required fields. Enter the exact column name from your CSV file.
        </Typography>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button onClick={onClose} variant="outlined">
          Cancel
        </Button>
        <Button variant="contained" onClick={() => onConfirm(values)}>
          Confirm & Analyze
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default MappingConfirmModal;
