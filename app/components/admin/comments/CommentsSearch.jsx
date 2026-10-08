import { SearchOutlined } from '@mui/icons-material';
import { InputAdornment, TextField } from '@mui/material';

import { softInputSx } from '../../utility/soft';

function CommentsSearch({ comments, search, setSearch }) {
  return (
    <>
      <TextField
        sx={[softInputSx, { width: '100%' }]}
        placeholder='Comment, SLIC, name or author'
        aria-label='Search comments'
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position='start'>
                <SearchOutlined />
              </InputAdornment>
            ),
          },
        }}
      />
    </>
  );
}

export default CommentsSearch;
