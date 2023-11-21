import { Button, Typography, Paper, Box } from '@mui/material';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import Image from 'next/image';

export default function HowToModal({ handleHowToModalClose }) {
  const slides = [
    { title: 'How To 2', img: '/howto_2.png', comment: '' },
    { title: 'How To 3', img: '/howto_3.png', comment: '' },
    { title: 'How To 4', img: '/howto_4.png', comment: '' },
    { title: 'How To 5', img: '/howto_5.png', comment: '' },
    { title: 'How To 6', img: '/howto_6.png', comment: '' },
    { title: 'How To 7', img: '/howto_7.png', comment: '' },
    { title: 'How To 8', img: '/howto_8.png', comment: '' },
    { title: 'How To 10', img: '/howto_10.png', comment: '' },
  ];

  const renderedSlides = slides.map((sl, index) => {
    return (
      <SwiperSlide key={index}>
        <Image
          src={sl.img}
          height={660}
          width={370}
          alt={`How to use this site ${sl.title} `}
          style={{ width: 'auto', height: '92%' }}
        />
      </SwiperSlide>
    );
  });

  return (
    <Paper
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '90%',
        height: '90%',
        p: '1rem 0',
      }}
    >
      <Typography
        variant="h6"
        textAlign="center"
        sx={{ fontSize: '1.5rem', textTransform: 'uppercase' }}
      >
        How to use this site
      </Typography>
      <Swiper
        className="mySwiper"
        navigation={true}
        pagination={true}
        modules={[Navigation, Pagination]}
      >
        <SwiperSlide>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              p: '2rem',
              width: '80%',
              height: '100%',
            }}
          >
            <Typography textAlign="center" fontWeight={500} sx={{ mb: '4rem' }}>
              I tried to make this site user-friendly and logical. If you have
              questions about how to use it email me
            </Typography>

            <Button
              variant="contained"
              href="mailto:webdevilishsmile@gmail.com"
            >
              Email
            </Button>
            <Typography textAlign="center" fontWeight={500} sx={{ mt: '3rem' }}>
              Scroll right to see some instructions on how to use this app.
            </Typography>
          </Box>
        </SwiperSlide>
        {renderedSlides}
        <SwiperSlide>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              p: '2rem',
              width: '80%',
              height: '100%',
            }}
          >
            <Typography textAlign="center" fontWeight={500} sx={{ mb: '4rem' }}>
              That&apos;s all there is to it. One application to keep all your
              SLIC information. I hope this is as useful for you as it is for
              me. Just remember, you are responsible for knowing where
              you&apos;re going. Drive safely.
            </Typography>
          </Box>
        </SwiperSlide>
      </Swiper>
      <Button variant="contained" onClick={handleHowToModalClose}>
        Close
      </Button>
    </Paper>
  );
}
