import React, { useId } from 'react';
import {
  Box,
  Button,
  Typography,
  LinearProgress,
  Alert,
  Stack,
  Chip,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  InsertDriveFile as FileIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';

function FileUpload({
  accept,
  label,
  onUpload,
  multiple = true,
  maxSize = 50,
}) {
  const inputId = useId();
  const [files, setFiles] = React.useState([]);
  const [isDragging, setIsDragging] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [done, setDone] = React.useState(false);

  const maxSizeBytes = maxSize * 1024 * 1024;

  const validateFiles = (filesToCheck) => {
    const errors = [];
    for (const file of filesToCheck) {
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
      if (file.size > maxSizeBytes) {
        errors.push(`${file.name}: File too large. Max ${maxSize}MB`);
      }
    }
    return errors;
  };

  const handleFiles = async (filesToProcess) => {
    setError(null);

    const validationErrors = validateFiles(filesToProcess);
    if (validationErrors.length > 0) {
      setError(validationErrors.join('\n'));
      return;
    }

    if (!multiple && filesToProcess.length > 1) {
      setError('Only one file is allowed');
      return;
    }

    setFiles(filesToProcess);
    setIsLoading(true);
    setDone(false);
    setProgress(2);

    let timer = null;
    timer = setInterval(() => {
      setProgress((p) => {
        if (p >= 85) return p;
        return Math.min(85, p + Math.random() * 10);
      });
    }, 400);

    try {
      await onUpload(filesToProcess);
      setProgress(100);
      setDone(true);
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      clearInterval(timer);
      setIsLoading(false);
      setTimeout(() => {
        setProgress(0);
        setDone(false);
        setFiles([]);
      }, 1200);
    }
  };

  const handleDragEnter = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
  const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); };
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFiles(Array.from(e.dataTransfer.files));
  };
  const handleFileInputChange = (e) => {
    handleFiles(Array.from(e.target.files));
    e.target.value = '';
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Box>
      <Box
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        sx={{
          p: 5,
          textAlign: 'center',
          border: '2px dashed',
          borderColor: isDragging ? 'primary.main' : '#CBD5E1',
          borderRadius: '12px',
          backgroundColor: isDragging ? 'primary.light' : '#FAFAFA',
          transition: 'all 0.2s ease',
          cursor: isLoading ? 'default' : 'pointer',
          '&:hover': !isLoading
            ? { borderColor: 'primary.main', backgroundColor: 'primary.light' }
            : {},
        }}
        onClick={() => !isLoading && document.getElementById(inputId)?.click()}
      >
        <input
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
          id={inputId}
        />

        {isLoading ? (
          <Stack spacing={2} alignItems="center" sx={{ width: '100%', px: 2 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                backgroundColor: done ? 'success.light' : 'primary.light',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 0.5,
              }}
            >
              {done ? (
                <CheckCircleIcon sx={{ color: 'success.main', fontSize: 24 }} />
              ) : (
                <CloudUploadIcon sx={{ color: 'primary.main', fontSize: 24 }} />
              )}
            </Box>
            <Typography variant="subtitle2" color="text.primary">
              {done ? 'Analysis complete!' : 'Analyzing with AI…'}
            </Typography>
            <Box sx={{ width: '100%', maxWidth: 320 }}>
              <LinearProgress variant="determinate" value={progress} color={done ? 'success' : 'primary'} />
            </Box>
            <Typography variant="caption" color="text.secondary">
              {Math.round(progress)}%
            </Typography>
          </Stack>
        ) : (
          <Stack spacing={1.5} alignItems="center">
            <Box
              sx={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                backgroundColor: isDragging ? 'primary.main' : '#E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
              }}
            >
              <CloudUploadIcon
                sx={{
                  fontSize: 26,
                  color: isDragging ? 'white' : '#64748B',
                  transition: 'all 0.2s ease',
                }}
              />
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.primary" gutterBottom>
                Drop files here or{' '}
                <Box
                  component="span"
                  sx={{ color: 'primary.main', cursor: 'pointer', textDecoration: 'underline' }}
                  onClick={(e) => { e.stopPropagation(); document.getElementById(inputId)?.click(); }}
                >
                  browse
                </Box>
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {accept ? accept.toUpperCase().replace(/\./g, '').replace(/,/g, ', ') : 'Any file'} &nbsp;·&nbsp; Max {maxSize}MB
              </Typography>
            </Box>
            <Button
              variant="contained"
              size="small"
              startIcon={<CloudUploadIcon />}
              onClick={(e) => { e.stopPropagation(); document.getElementById(inputId)?.click(); }}
              sx={{ mt: 0.5 }}
            >
              {label || 'Select Files'}
            </Button>
          </Stack>
        )}
      </Box>

      {files.length > 0 && !isLoading && (
        <Stack spacing={1} sx={{ mt: 2 }}>
          {files.map((file) => (
            <Box
              key={file.name}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                px: 2,
                py: 1.25,
                border: '1px solid',
                borderColor: 'success.light',
                borderRadius: '8px',
                bgcolor: 'success.light',
              }}
            >
              <FileIcon sx={{ color: 'success.dark', fontSize: 18, flexShrink: 0 }} />
              <Typography variant="body2" sx={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {file.name}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                {formatSize(file.size)}
              </Typography>
            </Box>
          ))}
        </Stack>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
            {error}
          </Typography>
        </Alert>
      )}
    </Box>
  );
}

export default FileUpload;
