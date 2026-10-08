import { TextField } from '@mui/material';
import { softInputSx } from '../../utility/soft';

export default function NewDriverField({
  label,
  value,
  onChange,
  required = false,
  type = 'text',
  helperText,
  disabled,
}) {
  return (
    <TextField
      label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      size='small'
      sx={softInputSx}
      fullWidth
      required={required}
      type={type}
      helperText={helperText}
      disabled={disabled}
    />
  );
}
