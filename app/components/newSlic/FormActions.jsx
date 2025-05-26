import { Box, Button } from '@mui/material';
import { useRouter } from 'next/navigation';

function FormActions({ handleClear, slicData }) {
  const router = useRouter();
  const handleSave = async () => {
    try {
      const response = await fetch('/api/newSlic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(slicData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create slic');
      }

      return result;
    } catch (error) {
      console.error('Error creating slic:', error);
      throw error;
    } finally {
      handleClear();
      router.push('/admin');
    }
  };

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: '30rem',
        display: 'flex',
        justifyContent: 'center',
        gap: '2rem',
        mt: '2rem',
      }}
    >
      <Button variant='contained' onClick={handleSave}>
        Save
      </Button>
      <Button variant='contained' color='error' onClick={handleClear}>
        Clear
      </Button>
    </Box>
  );
}

export default FormActions;
