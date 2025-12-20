import { TextField } from '@mui/material';

function CommentsSearch({ comments, search, setSearch }) {
  return (
    <>
      <TextField
        sx={{ width: '100%' }}
        label='Search Comments'
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
    </>
  );
}

export default CommentsSearch;
