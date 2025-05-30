import { ArrowDownward } from '@mui/icons-material';
import { TableCell, TableHead, TableRow } from '@mui/material';

function TableHeader({ sortCategory, setSortCategory, sort, setSort }) {
  // This component renders the table header with sortable columns
  // It receives the current sort category and a function to set the sort category
  // Clicking on a header cell will change the sort category
  const toggleSortOrder = () => {
    // Toggles the sort order between ascending and descending
    setSort((prevSort) =>
      prevSort === 'ascending' ? 'descending' : 'ascending'
    );
  };
  const handleSortClick = (category) => {
    setSortCategory(category);
    // If the clicked category is already the current sort category, toggle the sort order
    if (sortCategory === category) {
      toggleSortOrder();
    } else {
      // If a different category is clicked, set the sort to ascending
      setSort('ascending');
    }
  };
  // The style of the header cell changes based on the current sort category

  return (
    <TableHead>
      <TableRow>
        <TableCell
          onClick={() => handleSortClick('created_at')}
          style={{
            cursor: 'pointer',
            fontWeight: sortCategory === 'created_at' ? 'bold' : 'normal',
          }}
        >
          Date{' '}
          {sortCategory === 'created_at' &&
            (sort === 'descending' ? (
              <ArrowDownward sx={{ fontSize: '1rem' }} />
            ) : (
              <ArrowDownward
                sx={{ fontSize: '1rem', transform: 'rotate(180deg)' }}
              />
            ))}
        </TableCell>
        <TableCell
          onClick={() => handleSortClick('numSlic')}
          style={{
            cursor: 'pointer',
            fontWeight: sortCategory === 'numSlic' ? 'bold' : 'normal',
          }}
        >
          Slic{' '}
          {sortCategory === 'numSlic' &&
            (sort === 'descending' ? (
              <ArrowDownward sx={{ fontSize: '1rem' }} />
            ) : (
              <ArrowDownward
                sx={{ fontSize: '1rem', transform: 'rotate(180deg)' }}
              />
            ))}
        </TableCell>
        <TableCell
          onClick={() => handleSortClick('alphaSlic')}
          style={{
            cursor: 'pointer',
            fontWeight: sortCategory === 'alphaSlic' ? 'bold' : 'normal',
          }}
        >
          Alpha
          {sortCategory === 'alphaSlic' &&
            (sort === 'descending' ? (
              <ArrowDownward sx={{ fontSize: '1rem' }} />
            ) : (
              <ArrowDownward
                sx={{ fontSize: '1rem', transform: 'rotate(180deg)' }}
              />
            ))}
        </TableCell>
        <TableCell
          onClick={() => handleSortClick('name')}
          style={{
            cursor: 'pointer',
            fontWeight: sortCategory === 'name' ? 'bold' : 'normal',
          }}
        >
          Name{' '}
          {sortCategory === 'name' &&
            (sort === 'descending' ? (
              <ArrowDownward sx={{ fontSize: '1rem' }} />
            ) : (
              <ArrowDownward
                sx={{ fontSize: '1rem', transform: 'rotate(180deg)' }}
              />
            ))}
        </TableCell>
        <TableCell>Select</TableCell>
      </TableRow>
    </TableHead>
  );
}

export default TableHeader;
