import { Box, Typography, Paper } from '@mui/material';
import Image from 'next/image';
import AboutTitle from './AboutTitle';
import AboutImage from './AboutImage';
import AboutContainer from './AboutContainer';
import AboutText from './AboutText';

export default function Developer() {
  return (
    <AboutContainer>
      <AboutTitle title='The Developer' />
      <AboutImage
        source='https://yt3.ggpht.com/Ui8flBPVGPkaHysBMOwUC4n4dCwWIpizw4JzQTJogPtfVF85DRp8in8tlofVS3Fm_Dv7emaJLg=s176-c-k-c0x00ffffff-no-rj'
        altText='Tiago Davila'
      />

      <AboutText>
        My name is Tiago Davila, and I am a UPS Feeder driver. I have always
        possessed a strong interest in technology, and I started learning web
        development in 2021, around the same time I began working at UPS. I
        started learning to code for fun. While learning, everything I saw in my
        life was filtered through the lens of a developer, and I started
        thinking about how I could use my new skills to solve problems in my own
        life. I soon realized that the everyday hassle of looking up addresses
        in a binder, photocopying them, and reading them while driving was a
        problem I could solve with a web app. I built SLICs to make my own life
        easier, and now I am sharing it with other drivers in my building.
      </AboutText>
    </AboutContainer>
  );
}
