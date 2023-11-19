import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

import { Box } from '@mui/material';

import Main from './components/Main';

export default async function Home() {
  const supabase = createServerComponentClient({ cookies });
  const { data, error } = await supabase.auth.getSession();

  let { data: customers } = await supabase.from('customers').select('*');
  let { data: centers } = await supabase
    .from('centers')
    .select('*')
    .order('numSlic', { ascending: true });
  let { data: comments } = await supabase
    .from('comments')
    .select('*')
    .order('votes', { ascending: false });

  const session = data.session;
  const user = data.session?.user;

  return (
    <Box /* HOME PAGE CONTAINER */
      id="home"
      sx={{
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        overflow: 'hidden',
        p: '6rem 0',
        bgcolor: '#ebe8e8',
      }}
    >
      <Main
        customers={customers}
        centers={centers}
        comments={comments}
        session={session}
        user={user}
      />
    </Box>
  );
}
