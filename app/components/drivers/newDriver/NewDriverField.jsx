import { TextField } from '@mui/material';

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
      fullWidth
      required={required}
      type={type}
      helperText={helperText}
      disabled={disabled}
    />
  );
}
