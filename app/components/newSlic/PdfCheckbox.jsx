import {
  Box,
  Checkbox,
  FormControl,
  FormControlLabel,
  Typography,
} from '@mui/material';

function PdfCheckbox({ pdf, setPdf }) {
  return (
    <FormControl
      sx={{ width: '100%', maxWidth: '30rem', mt: '2rem', gap: '2rem' }}
    >
      <FormControlLabel
        control={
          <Checkbox checked={pdf} onChange={(e) => setPdf((prev) => !prev)} />
        }
        label='Pdf Included? (If checked, a PDF is present in Supabase storage)'
      />
    </FormControl>
  );
}

export default PdfCheckbox;
