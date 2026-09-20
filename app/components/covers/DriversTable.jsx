'use client';

import theme from '@/utils/theme';
import { Paper, Table, TableBody, TableContainer } from '@mui/material';
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
    <TableContainer component={Paper} sx={{ marginTop: 2, maxWidth: theme.layout.width.prose }}>
      <Table
        size='small'
        sx={{ minWidth: '20rem', width: '100%', tableLayout: 'fixed' }}
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
    </TableContainer>
  );
}

export default DriversTable;
