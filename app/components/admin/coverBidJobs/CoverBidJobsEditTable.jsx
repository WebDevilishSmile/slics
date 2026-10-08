'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { softTableSx } from '../../utility/soft';
import {
  CoverBidJobRowFields,
  CoverBidJobRowHeadCells,
} from './CoverBidJobRowCells';
import CoverBidJobRowActions from './CoverBidJobRowActions';

export default function CoverBidJobsEditTable({
  rows,
  onFieldChange,
  onSaveRow,
  onDeleteRow,
  savingKey,
  deletingKey,
}) {
  return (
    <TableContainer>
      <Table size='small' sx={softTableSx}>
        <TableHead>
          <TableRow>
            <CoverBidJobRowHeadCells />
            <TableCell align='right'>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.key} hover>
              <CoverBidJobRowFields
                row={row}
                onChange={(field, value) =>
                  onFieldChange(row.key, field, value)
                }
              />
              <TableCell align='right' sx={{ whiteSpace: 'nowrap' }}>
                <CoverBidJobRowActions
                  row={row}
                  onSave={onSaveRow}
                  onDelete={onDeleteRow}
                  saving={savingKey === row.key}
                  deleting={deletingKey === row.key}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
