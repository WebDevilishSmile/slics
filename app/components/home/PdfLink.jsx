import { Button } from '@mui/material';
import { legacyPdfUrl } from '@/utils/variables';

function PdfLink({ slic }) {
  // `pdfUrl` (Vercel Blob) wins. Any slic not yet migrated still carries the
  // legacy `pdf` boolean, which meant "a <alphaSlic>.pdf exists in the old
  // Supabase bucket" — keep honoring it so no link breaks mid-migration.
  const href =
    slic.pdfUrl || (slic.pdf ? legacyPdfUrl(slic.alphaSlic) : null);

  return (
    <Button
      disabled={!href}
      variant='contained'
      href={href || undefined}
      target='_blank'
      rel='noopener'
      sx={{ mt: '1rem' }}
    >
      View PDF
    </Button>
  );
}

export default PdfLink;
