import { ArrowDownward, ArrowUpward } from '@mui/icons-material';
import { TableCell, TableHead, TableRow } from '@mui/material';

function TableHeader({ sortCategory, setSortCategory, sort, setSort }) {
  // This component renders the table header with sortable columns
  // It receives the current sort category and a function to set the sort category
  // Clicking on a header cell will change the sort category

  const handleSortClick = (category) => {
    if (sortCategory === category) {
      // If the clicked category is already the current sort category, toggle the sort order
      setSort((prevSort) =>
        prevSort === 'ascending' ? 'descending' : 'ascending'
      );
    } else {
      // If a different category is clicked, set the sort to ascending
      setSortCategory(category);
      setSort('ascending');
    }
  };

  // The style of the header cell changes based on the current sort category
  const categories = [
    { id: 'created_at', label: 'Date' },
    { id: 'numSlic', label: 'Slic' },
    { id: 'alphaSlic', label: 'Alpha' },
    { id: 'name', label: 'Name' },
  ];

  return (
    <TableHead>
      <TableRow>
        {categories.map((category) => (
          <TableCell
            key={category.id}
            onClick={() => handleSortClick(category.id)}
            sx={{
              cursor: 'pointer',
              fontWeight: sortCategory === category.id ? 'bold' : 'normal',
              userSelect: 'none', // Prevents text selection on click
              '&:hover': {
                backgroundColor: 'action.hover',
              },
            }}
          >
            {category.label}
            {sortCategory === category.id && (
              <>
                {sort === 'ascending' ? (
                  <ArrowUpward sx={{ fontSize: '1rem', ml: 0.5 }} />
                ) : (
                  <ArrowDownward sx={{ fontSize: '1rem', ml: 0.5 }} />
                )}
              </>
            )}
          </TableCell>
        ))}
        <TableCell>Select</TableCell>
      </TableRow>
    </TableHead>
  );
}

export default TableHeader;
