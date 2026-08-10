'use client';

import { useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import {
  CoverBidJobRowFields,
  CoverBidJobRowHeadCells,
} from './CoverBidJobRowCells';
import CoverBidJobEditCard from './CoverBidJobEditCard';

const MAX_DIMENSION = 3200;
const JPEG_QUALITY = 0.92;

function resizeImageToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const image = new Image();
      image.onerror = reject;
      image.onload = () => {
        const scale = Math.min(
          1,
          MAX_DIMENSION / Math.max(image.width, image.height)
        );
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);

        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

        const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
        resolve(dataUrl.split(',')[1]);
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function emptyRow() {
  return {
    id: crypto.randomUUID(),
    jobNumber: '',
    name: '',
    assignedDriver: '',
    coverReason: '',
    sun: '',
    mon: '',
    tue: '',
    wed: '',
    thu: '',
    fri: '',
    sat: '',
    description: '',
  };
}

export default function BidSheetUploader({ weekEndDate, onSaved }) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const fileInputRef = useRef(null);
  const [rows, setRows] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const handlePickFile = () => fileInputRef.current?.click();

  const handleFileChange = async (event) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (files.length === 0) return;

    setUploading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const images = await Promise.all(
        files.map(async (file) => ({
          data: await resizeImageToBase64(file),
          mediaType: 'image/jpeg',
        }))
      );

      const res = await fetch('/api/coverBidJobs/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to extract rows from photo');
      }

      const newRows = data.rows.map((row) => ({ id: crypto.randomUUID(), ...row }));
      setRows((prev) => [...prev, ...newRows]);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleCellChange = (rowId, field, value) => {
    setRows((prev) =>
      prev.map((row) => (row.id === rowId ? { ...row, [field]: value } : row))
    );
  };

  const handleDeleteRow = (rowId) => {
    setRows((prev) => prev.filter((row) => row.id !== rowId));
  };

  const handleAddBlankRow = () => {
    setRows((prev) => [...prev, emptyRow()]);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch('/api/coverBidJobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weekEnding: weekEndDate.format('YYYY-MM-DD'),
          rows: rows.map(({ id, ...row }) => row),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save cover bid jobs');
      }

      setRows([]);
      setSuccessMessage(
        `Saved ${data.data.length} job${data.data.length === 1 ? '' : 's'} for week ending ${weekEndDate.format('MM/DD/YYYY')}.`
      );
      onSaved?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ marginTop: 3 }}>
      <input
        ref={fileInputRef}
        type='file'
        accept='image/*'
        multiple
        hidden
        onChange={handleFileChange}
      />

      <Button
        variant='outlined'
        startIcon={<UploadFileIcon />}
        onClick={handlePickFile}
        disabled={uploading}
      >
        {uploading ? 'Reading photos...' : 'Upload Bid Sheet Photo(s)'}
      </Button>

      {error && (
        <Alert severity='error' sx={{ marginTop: 2 }}>
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert severity='success' sx={{ marginTop: 2 }}>
          {successMessage}
        </Alert>
      )}

      {rows.length > 0 && (
        <>
          {isDesktop ? (
            <TableContainer component={Paper} sx={{ marginTop: 2 }}>
              <Table size='small'>
                <TableHead>
                  <TableRow>
                    <CoverBidJobRowHeadCells />
                    <TableCell />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id}>
                      <CoverBidJobRowFields
                        row={row}
                        onChange={(field, value) =>
                          handleCellChange(row.id, field, value)
                        }
                      />
                      <TableCell>
                        <IconButton
                          size='small'
                          onClick={() => handleDeleteRow(row.id)}
                          aria-label='Delete row'
                        >
                          <DeleteIcon fontSize='small' />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Stack spacing={1.5} sx={{ marginTop: 2 }}>
              {rows.map((row) => (
                <CoverBidJobEditCard
                  key={row.id}
                  row={row}
                  onChange={(field, value) =>
                    handleCellChange(row.id, field, value)
                  }
                  actions={
                    <IconButton
                      size='small'
                      onClick={() => handleDeleteRow(row.id)}
                      aria-label='Delete row'
                    >
                      <DeleteIcon fontSize='small' />
                    </IconButton>
                  }
                />
              ))}
            </Stack>
          )}

          <Box
            sx={{
              marginTop: 2,
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 2,
              alignItems: { xs: 'stretch', sm: 'center' },
            }}
          >
            <Button variant='text' onClick={handleAddBlankRow}>
              Add Row
            </Button>
            <Button
              variant='contained'
              onClick={handleSave}
              disabled={saving || !weekEndDate}
            >
              {saving
                ? 'Saving...'
                : `Save ${rows.length} Job${rows.length === 1 ? '' : 's'} for Week Ending ${weekEndDate ? weekEndDate.format('MM/DD/YYYY') : ''}`}
            </Button>
          </Box>
        </>
      )}

      {rows.length === 0 && (
        <Typography variant='body2' sx={{ marginTop: 1, color: 'text.secondary' }}>
          Upload one photo per page of the weekly bid sheet (select multiple
          files at once) to extract job rows. Shoot each page flat and
          straight-on for the most accurate results.
        </Typography>
      )}
    </Box>
  );
}
