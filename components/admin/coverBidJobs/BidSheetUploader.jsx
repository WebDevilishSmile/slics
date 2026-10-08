'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  IconButton,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import {
  FIELDS,
  findDuplicateJobNumbers,
  isDuplicateJobNumber,
  rowIssues,
  rowValues,
} from '@/lib/coverBidJobRow';
import { tapHaptic } from '@/lib/haptics';
import {
  softContainedSx,
  softPressSx,
  softRaisedSmall,
} from '@/components/utility/soft';
import CoverBidJobReviewDialog from './CoverBidJobReviewDialog';
import CoverBidJobSummaryCard from './CoverBidJobSummaryCard';
import CoverBidJobsTable from './CoverBidJobsTable';

const MAX_DIMENSION = 3200;
const JPEG_QUALITY = 0.92;
const MAX_PDF_SIZE_BYTES = 15 * 1024 * 1024;

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

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.readAsDataURL(file);
  });
}

function isPdfFile(file) {
  return (
    file.type === 'application/pdf' ||
    file.name?.toLowerCase().endsWith('.pdf')
  );
}

// A job read off the sheet (or added by hand) before it's saved: the twelve
// fields, whether the admin has checked it against the sheet, and which
// uploaded file (and PDF page) it was read from, for the review to show.
function draftRow(values = {}, { sourceIndex = null, sourcePage = null } = {}) {
  return {
    ...Object.fromEntries(FIELDS.map((field) => [field, values[field] ?? ''])),
    key: crypto.randomUUID(),
    checked: false,
    sourceIndex,
    sourcePage,
  };
}

const jobLabel = (row, index) =>
  row.jobNumber ? `job ${row.jobNumber}` : `row ${index + 1}`;

// The icon changes along with the color, so the state doesn't rest on color.
function CheckedStatus({ checked }) {
  return (
    <Box
      component='span'
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.5,
        typography: 'body2',
        fontWeight: 600,
        whiteSpace: 'nowrap',
        color: checked ? 'primary.main' : 'text.secondary',
      }}
    >
      {checked ? (
        <CheckCircleIcon fontSize='small' />
      ) : (
        <RadioButtonUncheckedIcon fontSize='small' />
      )}
      {checked ? 'Checked' : 'Not checked'}
    </Box>
  );
}

const softButtonSx = [softRaisedSmall, softPressSx, { px: 3, minHeight: '3rem' }];

// Reads the week's jobs off photos or PDFs of the bid sheet, then has the
// admin check each one against the sheet before saving: a table to edit in
// place on a wide screen, cards on a phone, and a review dialog that steps
// through the jobs with the sheet beside them. Accuracy matters more than
// speed here, so every job carries a "checked" mark and anything odd is
// flagged, but nothing blocks the save.
export default function BidSheetUploader({ weekEndDate, onSaved }) {
  const theme = useTheme();
  const wide = useMediaQuery(theme.breakpoints.up('lg'));
  const fileInputRef = useRef(null);
  const viewerMemory = useRef({});
  const objectUrls = useRef(new Set());
  const [rows, setRows] = useState([]);
  // The uploaded files, as object URLs, so the review can show the sheet.
  const [sources, setSources] = useState([]);
  const [reviewIndex, setReviewIndex] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Deleting the last job closes the review; it mustn't reopen on the next upload.
  if (rows.length === 0 && reviewIndex !== null) setReviewIndex(null);

  const duplicates = useMemo(() => findDuplicateJobNumbers(rows), [rows]);
  const checkedCount = rows.filter((row) => row.checked).length;
  const flaggedCount = rows.filter(
    (row) =>
      rowIssues(row, { duplicate: isDuplicateJobNumber(row, duplicates) })
        .length > 0
  ).length;

  useEffect(() => {
    const urls = objectUrls.current;
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  const releaseSources = (list) => {
    list.forEach(({ url }) => {
      URL.revokeObjectURL(url);
      objectUrls.current.delete(url);
    });
  };

  const handlePickFile = () => fileInputRef.current?.click();

  const handleFileChange = async (event) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (files.length === 0) return;

    setUploading(true);
    setError(null);
    setSuccessMessage(null);

    const batch = files.map((file) => {
      const url = URL.createObjectURL(file);
      objectUrls.current.add(url);
      return {
        id: crypto.randomUUID(),
        name: file.name,
        kind: isPdfFile(file) ? 'pdf' : 'image',
        url,
      };
    });

    try {
      const oversizedPdf = files.find(
        (file) => isPdfFile(file) && file.size > MAX_PDF_SIZE_BYTES
      );
      if (oversizedPdf) {
        throw new Error(
          `${oversizedPdf.name} is too large (max ${MAX_PDF_SIZE_BYTES / (1024 * 1024)}MB). Try a smaller or lower-resolution scan.`
        );
      }

      const images = await Promise.all(
        files.map(async (file) =>
          isPdfFile(file)
            ? { data: await fileToBase64(file), mediaType: 'application/pdf' }
            : { data: await resizeImageToBase64(file), mediaType: 'image/jpeg' }
        )
      );

      const res = await fetch('/api/cover-bid-jobs/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to extract rows from upload');
      }
      if (data.rows.length === 0) {
        throw new Error(
          'No job rows were found. Shoot each page flat and straight-on, then try again.'
        );
      }

      // `sourceFile` counts from 1 within this upload, and these files join
      // any already uploaded, so offset it. A row the model didn't place goes
      // with this upload's only file, when there's one.
      const offset = sources.length;
      const newRows = data.rows.map(({ sourceFile, sourcePage, ...values }) =>
        draftRow(values, {
          sourceIndex: sourceFile
            ? offset + sourceFile - 1
            : files.length === 1
              ? offset
              : null,
          sourcePage,
        })
      );
      setSources((prev) => [...prev, ...batch]);
      setRows((prev) => [...prev, ...newRows]);
    } catch (err) {
      releaseSources(batch);
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleFieldChange = useCallback((key, field, value) => {
    setRows((prev) =>
      prev.map((row) => (row.key === key ? { ...row, [field]: value } : row))
    );
  }, []);

  const setChecked = useCallback((key, checked) => {
    setRows((prev) =>
      prev.map((row) => (row.key === key ? { ...row, checked } : row))
    );
  }, []);

  const deleteRow = useCallback((key) => {
    setRows((prev) => prev.filter((row) => row.key !== key));
  }, []);

  const renderLeading = useCallback(
    (row, index) => (
      <>
        <Checkbox
          checked={row.checked}
          onChange={(event) => setChecked(row.key, event.target.checked)}
          slotProps={{
            input: {
              'aria-label': `Checked ${jobLabel(row, index)} against the sheet`,
            },
          }}
        />
        <Tooltip title='Review'>
          <IconButton
            aria-label={`Review ${jobLabel(row, index)}`}
            onClick={() => setReviewIndex(index)}
            sx={softPressSx}
          >
            <OpenInFullIcon fontSize='small' />
          </IconButton>
        </Tooltip>
      </>
    ),
    [setChecked]
  );

  const renderActions = useCallback(
    (row, index) => (
      <Tooltip title='Delete'>
        <IconButton
          aria-label={`Delete ${jobLabel(row, index)}`}
          onClick={() => deleteRow(row.key)}
          sx={[softPressSx, { color: 'error.main' }]}
        >
          <DeleteIcon fontSize='small' />
        </IconButton>
      </Tooltip>
    ),
    [deleteRow]
  );

  // Start at the first job not yet checked.
  const startReview = () => {
    const firstUnchecked = rows.findIndex((row) => !row.checked);
    setReviewIndex(firstUnchecked === -1 ? 0 : firstUnchecked);
  };

  // Marks the job checked and moves on to the next; after the last, closes.
  const handleLooksRight = (row, index) => {
    tapHaptic();
    setChecked(row.key, true);
    setReviewIndex(index < rows.length - 1 ? index + 1 : null);
  };

  const handleAddBlankRow = () => {
    setRows((prev) => [...prev, draftRow()]);
    // Cards have nothing to type into, so open the new job in the review.
    if (!wide) setReviewIndex(rows.length);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch('/api/cover-bid-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weekEnding: weekEndDate.format('YYYY-MM-DD'),
          rows: rows.map(rowValues),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save cover bid jobs');
      }

      setRows([]);
      releaseSources(sources);
      setSources([]);
      viewerMemory.current = {};
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
        accept='image/*,application/pdf,.pdf'
        multiple
        hidden
        onChange={handleFileChange}
      />

      <Button
        startIcon={<UploadFileIcon />}
        onClick={handlePickFile}
        disabled={uploading}
        sx={softButtonSx}
      >
        {uploading ? 'Reading files…' : 'Upload Bid Sheet Photo(s) or PDF(s)'}
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
          <Box
            sx={{
              mt: 3,
              mb: 2,
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { xs: 'stretch', sm: 'center' },
              gap: 2,
            }}
          >
            <Button
              startIcon={<FactCheckOutlinedIcon />}
              onClick={startReview}
              sx={softButtonSx}
            >
              {checkedCount === 0
                ? 'Review jobs'
                : checkedCount < rows.length
                  ? 'Continue review'
                  : 'Review again'}
            </Button>
            <Typography variant='body2' role='status'>
              {checkedCount} of {rows.length} checked against the sheet
              {flaggedCount > 0 && ` · ${flaggedCount} flagged`}
            </Typography>
          </Box>

          {wide ? (
            <CoverBidJobsTable
              rows={rows}
              duplicates={duplicates}
              onFieldChange={handleFieldChange}
              renderLeading={renderLeading}
              renderActions={renderActions}
              leadingLabel='Checked, and review'
            />
          ) : (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
                gap: 2,
              }}
            >
              {rows.map((row, index) => (
                <CoverBidJobSummaryCard
                  key={row.key}
                  row={row}
                  index={index}
                  duplicate={isDuplicateJobNumber(row, duplicates)}
                  status={<CheckedStatus checked={row.checked} />}
                  onOpen={setReviewIndex}
                />
              ))}
            </Box>
          )}

          <Box
            sx={{
              marginTop: 3,
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 2,
              alignItems: { xs: 'stretch', sm: 'center' },
            }}
          >
            <Button onClick={handleAddBlankRow} sx={softButtonSx}>
              Add Row
            </Button>
            <Button
              variant='contained'
              sx={[softContainedSx, { px: 3, minHeight: '3rem' }]}
              onClick={handleSave}
              disabled={saving || !weekEndDate}
            >
              {saving
                ? 'Saving…'
                : `Save ${rows.length} Job${rows.length === 1 ? '' : 's'} for Week Ending ${weekEndDate ? weekEndDate.format('MM/DD/YYYY') : ''}`}
            </Button>
          </Box>
        </>
      )}

      {rows.length === 0 && (
        <Typography variant='body2' sx={{ marginTop: 1, color: 'text.secondary' }}>
          Upload one photo per page of the weekly bid sheet (select multiple
          files at once), or upload a scanned PDF, to extract job rows. Shoot
          each page flat and straight-on for the most accurate results.
        </Typography>
      )}

      <CoverBidJobReviewDialog
        rows={rows}
        index={reviewIndex}
        onIndexChange={setReviewIndex}
        onClose={() => setReviewIndex(null)}
        onFieldChange={handleFieldChange}
        duplicates={duplicates}
        status={(row) => <CheckedStatus checked={row.checked} />}
        onDelete={(row) => deleteRow(row.key)}
        renderPrimary={(row, index) => (
          <Button
            variant='contained'
            startIcon={<CheckIcon />}
            onClick={() => handleLooksRight(row, index)}
            sx={[softContainedSx, { px: 3, minHeight: '3rem', whiteSpace: 'nowrap' }]}
          >
            Looks right
          </Button>
        )}
        sources={sources}
        viewerMemory={viewerMemory}
      />
    </Box>
  );
}
