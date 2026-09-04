import AboutContainer from './AboutContainer';
import AboutTitle from './AboutTitle';
import AboutImage from './AboutImage';
import AboutText from './AboutText';
import { Groups } from '@mui/icons-material';

export default function Community() {
  return (
    <AboutContainer>
      <AboutTitle title='The Community' />
      <AboutImage
        icon={
          <Groups
            sx={{
              fontSize: '5.5rem',
              display: 'block',
              margin: '0 auto',
              fill: '#1976d2',
            }}
          />
        }
      />

      <AboutText>
        I created the ability for drivers to add comments to SLICs so that they
        can share their experiences and tips with each other. This is especially
        useful for new drivers who may not be familiar with certain locations or
        procedures. By sharing their knowledge, drivers can help each other
        navigate the challenges of the job more effectively.
      </AboutText>
    </AboutContainer>
  );
}
