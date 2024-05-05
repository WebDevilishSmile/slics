'use client';

import { useState } from 'react';

import { ThemeProvider } from '@mui/material/styles';
import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from '@mui/material';

import { jobs } from './jobs';
import JobSelected from './JobSelected';

import theme from '../utilities/theme';

export default function Jobs() {
  const [job, setJob] = useState('');
  const [selectedJob, setSelectedJob] = useState('');

  function handleJobSelect(e) {
    const jobSelect = jobs.filter((j) => j.name === e.target.value);

    setJob(e.target.value);
    setSelectedJob(jobSelect[0]);
  }

  return (
    <ThemeProvider theme={theme}>
      <Box /* HOME PAGE CONTAINER */
        id='home'
        sx={{
          width: '100vw',
          minHeight: '95vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          overflow: 'hidden',
          pt: '6rem',
          pb: '6rem',
          backgroundColor: theme.palette.background.light,
        }}
      >
        <Typography
          textAlign='center'
          variant='body1'
          fontWeight='600'
          sx={{ m: '1rem 2rem 3rem 2rem', textTransform: 'uppercase' }}
        >
          Jobs
        </Typography>

        <Box /* SELECTION */
          id='selection'
          sx={{ width: { xs: '90%', sm: '90%', md: '35rem' }, mt: '1rem' }}
        >
          <FormControl fullWidth>
            <InputLabel>Jobs</InputLabel>
            <Select label='SLIC' value={job} onChange={handleJobSelect}>
              {jobs.map((job, index) => {
                return (
                  <MenuItem
                    key={index}
                    value={job.name}
                    sx={{ padding: '1rem' }}
                  >
                    {job.name}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
        </Box>

        {job && <JobSelected job={selectedJob}></JobSelected>}
      </Box>
    </ThemeProvider>
  );
}
