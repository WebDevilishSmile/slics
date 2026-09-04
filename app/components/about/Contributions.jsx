import { VolunteerActivism } from '@mui/icons-material';
import AboutContainer from './AboutContainer';
import AboutImage from './AboutImage';
import AboutLink from './AboutLink';
import AboutText from './AboutText';
import AboutTitle from './AboutTitle';
import Image from 'next/image';

export default function Contributions() {
  return (
    <AboutContainer>
      <AboutTitle title='Contributions' />
      <AboutImage
        icon={
          <VolunteerActivism
            sx={{
              fontSize: '5rem',
              display: 'block',
              margin: '0 auto',
              fill: '#1976d2',
            }}
          />
        }
      />
      <AboutText>
        I don't charge for the app, and I don't plan to. I built it to make my
        own life easier, and I want to share it with other drivers in my
        building. This is a labor of love, and it took a lot of time and effort
        to build. If you want to support me, you can do so by buying me a
        coffee!
      </AboutText>

      <AboutLink
        link='https://buymeacoffee.com/tiagodavila'
        color={{ backgroundColor: '#f7f7f7', color: 'black' }}
      >
        <Image
          src='/bmc-brand-logo.svg'
          width={148}
          height={24}
          alt='Buy Me a Coffee'
        />
      </AboutLink>
    </AboutContainer>
  );
}
