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
} from '@mui/material';

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
      <DialogTitle>Confirm CSV Column Mapping</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ mb: 2 }}>
          We detected the following column mapping. Please confirm or edit any mappings before analysis.
        </Typography>

        {suggestion?.headers && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2">Detected headers</Typography>
            <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {suggestion.headers.map((h) => (
                <Chip
                  key={h}
                  label={h}
                  size="small"
                />
              ))}
            </Box>
          </Box>
        )}

        {suggestion?.sample_rows && suggestion.sample_rows.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2">Sample rows</Typography>
            <Table size="small">
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
          </Box>
        )}
        <Grid container spacing={2}>
          {CANONICAL_FIELDS.map((field) => (
            <Grid item xs={12} sm={6} key={field}>
              <TextField
                label={`${field} (${(confidences[field] || 0).toFixed(2)})`}
                value={values[field] || ''}
                onChange={(e) => handleChange(field, e.target.value)}
                fullWidth
                helperText={`Confidence: ${(confidences[field] || 0).toFixed(2)}`}
              />
            </Grid>
          ))}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={() => onConfirm(values)}
        >
          Confirm Mapping
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default MappingConfirmModal;
