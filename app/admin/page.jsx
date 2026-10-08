import { Button, ButtonGroup, Typography, Box } from '@mui/material';
import Link from 'next/link';


async function AdminPage() {
  const adminLinks = [
    { href: '/admin/slics', label: 'Slics' },
    { href: '/admin/comments', label: 'Comments' },
    { href: '/admin/users', label: 'Users' },
    { href: '/admin/cover/drivers', label: 'Cover Drivers' },
    { href: '/admin/cover/jobs', label: 'Cover Jobs' },
    { href: '/admin/drivers', label: 'Drivers' },
    { href: '/admin/planet-fitness', label: 'Planet Fitness' },
  ];

  return (
    <>
      <Typography variant='sectionHeading'>Admin Page</Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 4 }}>
        {adminLinks.map(({ href, label }) => (
          <Button
            variant='contained'
            key={href}
            LinkComponent={Link}
            href={href}
          >
            {label}
          </Button>
        ))}
      </Box>
    </>
  );
}

export default AdminPage;
