'use client';

import { Box } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../utilities/theme';
import { purchaseItems } from '../components/PurchaseItems';

import {
  Button,
  Card,
  CardActionArea,
  CardActions,
  CardContent,
  CardMedia,
  Typography,
} from '@mui/material';

export default function recommended() {
  const renderedItems = purchaseItems.map(function (item) {
    return (
      <Card
        key={item.name}
        sx={{ maxWidth: '18rem', minWidth: '12rem', p: '2rem', mb: '2rem' }}
      >
        <CardActionArea>
          <CardMedia component="img" image={item.img} />
          <CardContent>
            <Typography variant="h6" sx={{ mt: '.5rem', fontWeight: '700' }}>
              {item.name}
            </Typography>
            <Typography variant="h6" sx={{ mt: '.5rem' }}>
              {item.price}
            </Typography>
          </CardContent>
        </CardActionArea>
        <CardActions>
          <Button variant="contained" href={item.link}>
            Shop Now
          </Button>
        </CardActions>
      </Card>
    );
  });

  return (
    <ThemeProvider theme={theme}>
      <Box /* HOME PAGE CONTAINER */
        id="home"
        sx={{
          width: '100vw',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          overflow: 'hidden',
          pt: '6rem',
          backgroundColor: theme.palette.background.light,
        }}
      >
        <Typography
          textAlign="center"
          variant="body1"
          fontWeight="600"
          sx={{ m: '1rem 2rem 3rem 2rem', textTransform: 'uppercase' }}
        >
          These are just things I think are useful. I do NOT receive any money
          from advertising items here.{' '}
        </Typography>
        {renderedItems}
      </Box>
    </ThemeProvider>
  );
}
