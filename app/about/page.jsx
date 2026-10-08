import { Typography } from '@mui/material';
import App from '@/components/about/App';
import Community from '@/components/about/Community';
import Contributions from '@/components/about/Contributions';
import Developer from '@/components/about/Developer';
import Future from '@/components/about/Future';
import PageContainer from '@/components/layout/PageContainer';

export default function AboutPage() {
  return (
    <PageContainer>
      <Typography variant='sectionHeading'>About</Typography>

      <Developer />
      <App />
      <Community />
      <Contributions />
      <Future />
    </PageContainer>
  );
}
