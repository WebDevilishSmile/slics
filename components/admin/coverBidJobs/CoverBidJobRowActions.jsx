'use client';

import { CircularProgress, IconButton, Tooltip } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import { isDirty } from '@/lib/coverBidJobRow';
import { softPressSx } from '@/components/utility/soft';
import HideJobButton from './HideJobButton';

export default function CoverBidJobRowActions({
  row,
  onSave,
  onDelete,
  onToggleHidden,
  saving = false,
  deleting = false,
  hidden = false,
  hiding = false,
}) {
  const label = row.jobNumber ? `job ${row.jobNumber}` : 'this row';
  const dirty = isDirty(row);

  return (
    <>
      <HideJobButton
        row={row}
        hidden={hidden}
        onToggle={onToggleHidden}
        busy={hiding}
        size='small'
        disabled={saving || deleting}
        sx={[softPressSx, { mr: 1 }]}
      />
      <Tooltip title={dirty ? `Save ${label}` : 'No unsaved changes'}>
        {/* A disabled button emits no events, so the tooltip needs a live wrapper. */}
        <span>
          <IconButton
            size='small'
            sx={[softPressSx, { mr: 1 }]}
            onClick={() => onSave(row)}
            disabled={!dirty || saving || deleting || hiding}
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
            sx={softPressSx}
            onClick={() => onDelete(row)}
            disabled={saving || deleting || hiding}
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
