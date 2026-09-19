'use client';

import { useRef, useState } from 'react';
import { Alert, Box, Button, Typography } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DeleteIcon from '@mui/icons-material/Delete';
import { SLIC_PDF_MAX_BYTES } from '@/utils/variables';

function isPdfFile(file) {
  return (
    file.type === 'application/pdf' ||
    file.name?.toLowerCase().endsWith('.pdf')
  );
}

// Attaches a directions PDF to an existing slic via app/api/slic/[id]/pdf.
// Lives on the edit form only — a PDF needs a saved slic to belong to.
// Manages its own state rather than the form's, so the form's Update button
// never touches `pdfUrl` and this never touches the other fields.
function PdfUpload({ slicId, pdfUrl: initialPdfUrl }) {
  const fileInputRef = useRef(null);
  const [pdfUrl, setPdfUrl] = useState(initialPdfUrl || null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const endpoint = `/api/slic/${slicId}/pdf`;

  const handlePickFile = () => fileInputRef.current?.click();

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setError(null);
    setSuccessMessage(null);

    if (!isPdfFile(file)) {
      setError('Only PDF files are accepted.');
      return;
    }

    if (file.size > SLIC_PDF_MAX_BYTES) {
      setError(
        `${file.name} is too large (max ${SLIC_PDF_MAX_BYTES / (1024 * 1024)}MB).`
      );
      return;
    }

    const hadPdf = Boolean(pdfUrl);
    setBusy(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(endpoint, { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload PDF');
      }

      setPdfUrl(data.pdfUrl);
      setSuccessMessage(hadPdf ? 'PDF replaced.' : 'PDF uploaded.');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async () => {
    setError(null);
    setSuccessMessage(null);
    setBusy(true);

    try {
      const res = await fetch(endpoint, { method: 'DELETE' });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to remove PDF');
      }

      setPdfUrl(null);
      setSuccessMessage('PDF removed.');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: '30rem', mt: '2rem' }}>
      <Typography variant='subtitle1' sx={{ mb: 1 }}>
        Directions PDF
      </Typography>

      <input
        ref={fileInputRef}
        type='file'
        accept='application/pdf,.pdf'
        hidden
        onChange={handleFileChange}
      />

      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 1.5,
          alignItems: 'center',
        }}
      >
        {pdfUrl ? (
          <Button
            variant='outlined'
            href={pdfUrl}
            target='_blank'
            rel='noopener'
          >
            View current PDF
          </Button>
        ) : (
          <Typography variant='body2' sx={{ color: 'text.secondary' }}>
            No PDF attached.
          </Typography>
        )}

        <Button
          variant='contained'
          startIcon={<UploadFileIcon />}
          onClick={handlePickFile}
          disabled={busy}
        >
          {busy ? 'Working...' : pdfUrl ? 'Replace PDF' : 'Upload PDF'}
        </Button>

        {pdfUrl && (
          <Button
            variant='text'
            color='error'
            startIcon={<DeleteIcon />}
            onClick={handleRemove}
            disabled={busy}
          >
            Remove
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity='error' sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert severity='success' sx={{ mt: 2 }}>
          {successMessage}
        </Alert>
      )}
    </Box>
  );
}

export default PdfUpload;
