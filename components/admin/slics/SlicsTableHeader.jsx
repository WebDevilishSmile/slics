import { Box, TableCell, TableHead, TableRow, TableSortLabel } from '@mui/material';

// Shown to screen readers only (the actions column needs a header, the eye
// doesn't). The usual clip pattern, as in home/TitleAddress.jsx; the sizes
// are strings because a bare 1 in sx means 100%.
const visuallyHidden = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
  border: 0,
  padding: 0,
  margin: '-1px',
};

// On a phone the table keeps SLIC, Alpha, Name and the actions menu; the
// dates come back from `sm` up (SlicRow hides the same cells).
export const wideOnly = { display: { xs: 'none', sm: 'table-cell' } };

const categories = [
  { id: 'created_at', label: 'Added', sx: wideOnly },
  { id: 'numSlic', label: 'SLIC' },
  { id: 'alphaSlic', label: 'Alpha' },
  { id: 'name', label: 'Name' },
];

// Sortable column headers. Each label is a button (TableSortLabel), so the
// sort works from the keyboard and the active column carries aria-sort.
// Clicking the active column flips its direction; another column starts
// ascending.
function SlicsTableHeader({ sortCategory, setSortCategory, sort, setSort }) {
  const handleSortClick = (category) => {
    if (sortCategory === category) {
      setSort((prevSort) =>
        prevSort === 'ascending' ? 'descending' : 'ascending'
      );
    } else {
      setSortCategory(category);
      setSort('ascending');
    }
  };
  const direction = sort === 'ascending' ? 'asc' : 'desc';

  return (
    <TableHead>
      <TableRow>
        {categories.map((category) => {
          const active = sortCategory === category.id;
          return (
            <TableCell
              key={category.id}
              sortDirection={active ? direction : false}
              sx={category.sx}
            >
              <TableSortLabel
                active={active}
                direction={active ? direction : 'asc'}
                onClick={() => handleSortClick(category.id)}
              >
                {category.label}
              </TableSortLabel>
            </TableCell>
          );
        })}
        <TableCell sx={wideOnly}>Last edited</TableCell>
        <TableCell>
          <Box component='span' sx={visuallyHidden}>
            Actions
          </Box>
        </TableCell>
      </TableRow>
    </TableHead>
  );
}

export default SlicsTableHeader;
