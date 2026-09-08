'use client';

import { CircularProgress, IconButton, Tooltip } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import { isDirty } from './coverBidJobRow';

export default function CoverBidJobRowActions({
  row,
  onSave,
  onDelete,
  saving = false,
  deleting = false,
}) {
  const label = row.jobNumber ? `job ${row.jobNumber}` : 'this row';
  const dirty = isDirty(row);

  return (
    <>
      <Tooltip title={dirty ? `Save ${label}` : 'No unsaved changes'}>
        {/* A disabled button emits no events, so the tooltip needs a live wrapper. */}
        <span>
          <IconButton
            size='small'
            onClick={() => onSave(row)}
            disabled={!dirty || saving || deleting}
            aria-label={`Save ${label}`}
          >
            {saving ? (
              <CircularProgress size={18} color='inherit' />
            ) : (
              <SaveIcon fontSize='small' />
            )}
          </IconButton>
        </span>
      </Tooltip>

      <Tooltip title={`Delete ${label}`}>
        <span>
          <IconButton
            size='small'
            color='error'
            onClick={() => onDelete(row)}
            disabled={saving || deleting}
            aria-label={`Delete ${label}`}
          >
            {deleting ? (
              <CircularProgress size={18} color='inherit' />
            ) : (
              <DeleteIcon fontSize='small' />
            )}
          </IconButton>
        </span>
      </Tooltip>
    </>
  );
}
