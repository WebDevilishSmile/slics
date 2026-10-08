'use client';

import theme from '@/utils/theme';
import { Box, Paper, Table, TableBody } from '@mui/material';
import { softTableSx } from '../utility/soft';
import CoverPosition from './CoverPosition';
import DriverTableHead from './DriverTableHead';
import { useState } from 'react';
import { useRouter } from 'next/navigation'; // Import the router

function DriversTable({ covers }) {
  const [isEditing, setIsEditing] = useState(0);
  const router = useRouter(); // Initialize the router

  const handleSaveSuccess = () => {
    setIsEditing(0); // Close the edit field
    router.refresh(); // Fetch fresh data from MongoDB
  };

  return (
    <Paper
      variant='panel'
      sx={{
        maxWidth: theme.layout.width.prose,
        minHeight: 0,
        alignItems: 'stretch',
        px: { xs: 1, sm: 3 },
      }}
    >
      {/* Scrolls sideways rather than bursting the panel on a narrow phone. */}
      <Box sx={{ width: '100%', overflowX: 'auto' }}>
        <Table
          size='small'
          sx={[softTableSx, { minWidth: '20rem', width: '100%', tableLayout: 'fixed' }]}
        >
          <DriverTableHead />
          <TableBody>
            {covers.map((cover) => (
              <CoverPosition
                key={cover._id}
                cover={cover}
                isEditing={isEditing}
                setIsEditing={setIsEditing}
                onSaveSuccess={handleSaveSuccess} // Pass the success handler down
              />
            ))}
          </TableBody>
        </Table>
      </Box>
    </Paper>
  );
}

export default DriversTable;
