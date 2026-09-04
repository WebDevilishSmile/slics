import AboutContainer from './AboutContainer';
import AboutTitle from './AboutTitle';
import AboutImage from './AboutImage';
import AboutText from './AboutText';
import AboutLink from './AboutLink';
import { Email as EmailIcon, Update as UpdateIcon } from '@mui/icons-material';

export default function Future() {
  return (
    <AboutContainer>
      <AboutTitle title='The Future' />
      <AboutImage
        icon={
          <UpdateIcon
            sx={{
              fontSize: '5rem',
              display: 'block',
              margin: '0 auto',
              fill: '#1976d2',
            }}
          />
        }
        altText='SLICs Future'
      />
      <AboutText>
        I would love to expand SLICs to provide other hubs with access to their
        hubs, customers, and PDFs. If you are a UPS Feeder driver and would like
        to see SLICs in your building, please reach out to me via email at the
        link below.
      </AboutText>
      <AboutLink link='mailto:webdevilishsmile@gmail.com'>
        <EmailIcon sx={{ mr: 1 }} /> Email me
      </AboutLink>
    </AboutContainer>
  );
}
