import { Groups } from '@mui/icons-material';
import AboutSection from './AboutSection';
import ImpactLine from '@/components/support/ImpactLine';

export default function Community() {
  return (
    <AboutSection
      title='The Community'
      icon={Groups}
      iconSize='5.5rem'
      action={<ImpactLine />}
    >
      I created the ability for drivers to add comments to SLICs so that they
      can share their experiences and tips with each other. This is especially
      useful for new drivers who may not be familiar with certain locations or
      procedures. By sharing their knowledge, drivers can help each other
      navigate the challenges of the job more effectively.
    </AboutSection>
  );
}
