import { SearchOutlined } from '@mui/icons-material';
import { InputAdornment, TextField } from '@mui/material';

import { softInputSx } from '@/components/utility/soft';

function SlicsFilter({ search, setSearch }) {
  return (
    <TextField
      sx={[softInputSx, { flex: 1, minWidth: 0 }]}
      // Short enough to fit beside "New SLIC" at 390px; the label says what it matches.
      placeholder='Search SLICs'
      aria-label='Search SLICs by number, alpha or name'
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
