import { SearchOutlined } from '@mui/icons-material';
import { InputAdornment, TextField } from '@mui/material';

import { softInputSx } from '../../utility/soft';

function SlicsFilter({ search, setSearch }) {
  return (
    <TextField
      sx={[softInputSx, { flex: 1, minWidth: 0 }]}
      placeholder='SLIC, alpha or name'
      aria-label='Search SLICs'
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
  );
}

export default SlicsFilter;
