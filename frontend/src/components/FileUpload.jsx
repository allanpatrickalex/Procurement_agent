import React, { useState } from 'react';
import {
  Box,
  Button,
  Paper,
  Typography,
  LinearProgress,
  Alert,
  Stack,
  CircularProgress,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';

/**
 * Reusable file upload component with drag-and-drop support.
 *
 * @param {Object} props - Component props
 * @param {string} props.accept - File type filter (e.g., ".pdf" or ".csv")
 * @param {string} props.label - Upload button label
 * @param {Function} props.onUpload - Callback function(files) when files are selected
 * @param {boolean} props.multiple - Allow multiple files (default: true)
 * @param {number} props.maxSize - Max file size in MB (default: 50)
 */
function FileUpload({
  accept,
  label,
  onUpload,
  multiple = true,
  maxSize = 50,
}) {
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const maxSizeBytes = maxSize * 1024 * 1024;

  const validateFiles = (filesToCheck) => {
    const errors = [];

    for (const file of filesToCheck) {
      // Check file type
      if (accept) {
        const acceptedTypes = accept.split(',').map((t) => t.trim());
        const fileExt = `.${file.name.split('.').pop().toLowerCase()}`;
        const isAcceptedType = acceptedTypes.some(
          (type) => type === fileExt || type === file.type
        );

        if (!isAcceptedType) {
          errors.push(`${file.name}: Invalid file type. Expected ${accept}`);
        }
      }

      // Check file size
      if (file.size > maxSizeBytes) {
        errors.push(
          `${file.name}: File too large. Max size is ${maxSize}MB`
        );
      }
    }

    return errors;
  };

  const handleFiles = async (filesToProcess) => {
    setError(null);

    // Validate files
    const validationErrors = validateFiles(filesToProcess);
    if (validationErrors.length > 0) {
      setError(validationErrors.join('\n'));
      return;
    }

    // Check multiple files restriction
    if (!multiple && filesToProcess.length > 1) {
      setError('Only one file is allowed');
      return;
    }

    setFiles(filesToProcess);
    setIsLoading(true);

    try {
      await onUpload(filesToProcess);
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setIsLoading(false);
      setFiles([]);
    }
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  };

  const handleFileInputChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    handleFiles(selectedFiles);
  };

  return (
    <Box>
      <Paper
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        sx={{
          p: 4,
          textAlign: 'center',
          border: '2px dashed',
          borderColor: isDragging ? 'primary.main' : 'divider',
          backgroundColor: isDragging ? 'action.hover' : 'background.paper',
          transition: 'all 0.3s ease',
          cursor: 'pointer',
          '&:hover': {
            borderColor: 'primary.main',
            backgroundColor: 'action.hover',
          },
        }}
      >
        <input
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
          id="file-input"
        />

        {isLoading ? (
          <Stack spacing={2} alignItems="center">
            <CircularProgress />
            <Typography variant="body2" color="textSecondary">
              Processing files...
            </Typography>
          </Stack>
        ) : (
          <>
            <CloudUploadIcon
              sx={{
                fontSize: 48,
                color: 'primary.main',
                mb: 1,
              }}
            />
            <Typography variant="h6" gutterBottom>
              Upload Files
            </Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Drag and drop files here, or click to select
            </Typography>
            <Typography variant="caption" color="textSecondary" gutterBottom>
              Accepted: {accept || 'any'} • Max size: {maxSize}MB
            </Typography>

            <Box sx={{ mt: 2 }}>
              <Button
                component="label"
                htmlFor="file-input"
                variant="contained"
                startIcon={<CloudUploadIcon />}
                disabled={isLoading}
              >
                {label || 'Select Files'}
              </Button>
            </Box>
          </>
        )}
      </Paper>

      {files.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2">Selected Files:</Typography>
          <Stack spacing={1}>
            {files.map((file) => (
              <Box
                key={file.name}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  p: 1,
                  backgroundColor: 'success.light',
                  borderRadius: 1,
                }}
              >
                <CheckCircleIcon sx={{ color: 'success.main' }} />
                <Typography variant="body2">{file.name}</Typography>
                <Typography variant="caption" color="textSecondary">
                  ({(file.size / 1024).toFixed(2)} KB)
                </Typography>
              </Box>
            ))}
          </Stack>
        </Box>
      )}

      {error && (
        <Alert
          severity="error"
          sx={{ mt: 2 }}
          icon={<ErrorIcon />}
        >
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
            {error}
          </Typography>
        </Alert>
      )}
    </Box>
  );
}

export default FileUpload;
