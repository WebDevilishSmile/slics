import { TextField } from '@mui/material';

function SlicsFilter({ search, setSearch }) {
  return (
    <TextField
      sx={{ width: '50%' }}
      label='Search'
      value={search}
      onChange={(e) => setSearch(e.target.value)}
    />
  );
}

export default SlicsFilter;
