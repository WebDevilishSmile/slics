import { VolunteerActivism } from '@mui/icons-material';
import BuyMeACoffeeButton from '@/components/layout/BuyMeACoffeeButton';
import AboutSection from './AboutSection';

export default function Contributions() {
  return (
    <AboutSection
      title='Contributions'
      icon={VolunteerActivism}
      action={<BuyMeACoffeeButton />}
    >
      I don&apos;t charge for the app, and I don&apos;t plan to. I built it to make my
      own life easier, and I want to share it with other drivers in my
      building. This is a labor of love, and it took a lot of time and effort
      to build. If you want to support me, you can do so by buying me a
      coffee!
    </AboutSection>
  );
}
