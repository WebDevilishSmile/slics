import { Button } from '@mui/material';

function PdfLink({ slic }) {
  return (
    <Button
      disabled={!slic.pdf}
      variant='contained'
      href={`https://ndjeljyamsbvaibhgjmk.supabase.co/storage/v1/object/public/Customer%20Center%20Directions//${slic.alphaSlic
        .toString()
        .toLowerCase()}.pdf`}
      sx={{ mt: '1rem' }}
    >
      View PDF
    </Button>
  );
}

export default PdfLink;
