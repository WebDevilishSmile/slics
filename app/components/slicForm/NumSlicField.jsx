import theme from '@/utils/theme';
import { FormControl, TextField } from '@mui/material';
import { softInputSx } from '../utility/soft';

// `readOnly` on edit: numSlic is the key comments, history and view counts
// hang off, and the API rejects changing it.
function NumSlicField({ numSlic, setNumSlic, readOnly = false }) {
  const handleChange = (event) => {
    setNumSlic(event.target.value.toUpperCase());
  };

  return (
    <FormControl sx={{ width: '100%', maxWidth: theme.layout.width.field, mt: 4 }}>
      <TextField
        required
        autoFocus
        label='NumSlic'
        sx={softInputSx}
        value={numSlic}
        onChange={handleChange}
        slotProps={{ input: { readOnly } }}
        helperText={
          readOnly
            ? "Can't be changed after creation — comments and history are linked to it."
            : undefined
        }
      />
    </FormControl>
  );
}

export default NumSlicField;
