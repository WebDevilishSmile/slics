import { VolunteerActivism } from '@mui/icons-material';
import BuyMeACoffeeButton from '../layout/BuyMeACoffeeButton';
import AboutContainer from './AboutContainer';
import AboutImage from './AboutImage';
import AboutText from './AboutText';
import AboutTitle from './AboutTitle';

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
              color: 'primary.main',
            }}
          />
        }
      />
      <AboutText>
        I don&apos;t charge for the app, and I don&apos;t plan to. I built it to make my
        own life easier, and I want to share it with other drivers in my
        building. This is a labor of love, and it took a lot of time and effort
        to build. If you want to support me, you can do so by buying me a
        coffee!
      </AboutText>

      <BuyMeACoffeeButton />
    </AboutContainer>
  );
}
