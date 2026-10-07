import { Typography } from '@mui/material';
import BackButton from '../components/layout/BackButton';
import PageContainer from '../components/layout/PageContainer';

export default function WhipItInAndOutPage() {
  return (
    <PageContainer>
      <BackButton />
      <Typography variant='sectionHeading'>
        Whip It In And <br /> Whip It Out
      </Typography>
    </PageContainer>
  );
}
