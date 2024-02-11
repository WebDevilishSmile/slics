'use client';

import { useState } from 'react';

import theme from '../utilities/theme';

import {
  Avatar,
  Box,
  Button,
  IconButton,
  Modal,
  Paper,
  Typography,
} from '@mui/material';

import ArrowCircleUpIcon from '@mui/icons-material/ArrowCircleUp';
import ArrowCircleDownIcon from '@mui/icons-material/ArrowCircleDown';
import MapsUgcOutlinedIcon from '@mui/icons-material/MapsUgcOutlined';
import DeleteForeverOutlinedIcon from '@mui/icons-material/DeleteForeverOutlined';
import EditNoteOutlinedIcon from '@mui/icons-material/EditNoteOutlined';

import AddCommentModal from './AddCommentModal';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import EditCommentModal from './EditCommentModal';

export default function DestInfo({
  customer,
  slic,
  comments,
  session,
  user,
  checked,
}) {
  const [openAddComm, setOpenAddComm] = useState(false);
  const [editComm, setEditComm] = useState(false);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [upDisabled, setUpDisabled] = useState([]);
  const [downDisabled, setDownDisabled] = useState([]);

  const supabase = createClientComponentClient();
  const router = useRouter();
  const userName = user?.user_metadata.name.split(' ')[0];
  const userId = user?.id;

  const handleCloseEditModal = () => {
    setEditComm(false);
  };
  const handleAddComm = () => {
    setOpenAddComm(true);
  };
  const handleCloseCommModal = () => {
    setOpenAddComm(false);
  };

  const customerComments = comments.map((com, index) => {
    const handleEditComm = () => {
      setTitle(com.title);
      setComment(com.comment);
      setEditComm(true);
      console.log(title);
    };

    if (com.numSlic === slic) {
      let votes = com.votes;

      const deleteComment = async () => {
        const { error } = await supabase
          .from('comments')
          .delete()
          .eq('id', com.id);

        router.refresh();
      };

      const upVote = async () => {
        const { data, error } = await supabase
          .from('comments')
          .update({ votes: votes + 1 })
          .eq('id', com.id)
          .select();

        setUpDisabled([...upDisabled, index]);
        const removeDown = (remove) => {
          const updatedVote = downDisabled.filter((vote) => {
            return vote !== remove;
          });
          setDownDisabled(updatedVote);
        };
        removeDown(index);
        router.refresh();
      };
      const downVote = async () => {
        const { data, error } = await supabase
          .from('comments')
          .update({ votes: votes - 1 })
          .eq('id', com.id)
          .select();

        setDownDisabled([...downDisabled, index]);
        const removeUp = (remove) => {
          const updatedVote = upDisabled.filter((vote) => {
            return vote !== remove;
          });
          setUpDisabled(updatedVote);
        };
        removeUp(index);
        router.refresh();
      };

      return (
        <Box
          key={com.id}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'center',
            mt: '.5rem',
            bgcolor: theme.palette.background.light,
            p: '.5rem',
            borderRadius: '6px',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
            }}
          >
            <Avatar src={com.user_avatar} />
            <Typography
              variant='body1'
              fontWeight='700'
              sx={{ textTransform: 'uppercase', fontSize: '.8rem' }}
            >
              {com.title}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton
                size='small'
                onClick={() => upVote()}
                disabled={upDisabled.includes(index)}
              >
                <ArrowCircleUpIcon />
              </IconButton>
              <Typography sx={{ fontSize: '.8rem' }}>{com.votes}</Typography>
              <IconButton
                size='small'
                onClick={() => downVote()}
                disabled={downDisabled.includes(index)}
              >
                <ArrowCircleDownIcon />
              </IconButton>
            </Box>
          </Box>
          <Box sx={{ p: '1rem' }}>
            <Typography sx={{ fontSize: '.8rem' }}>{com.comment}</Typography>
          </Box>
          {userId === com.user_id && (
            <Box>
              <IconButton onClick={handleEditComm}>
                <EditNoteOutlinedIcon />
              </IconButton>
              <IconButton onClick={deleteComment}>
                <DeleteForeverOutlinedIcon />
              </IconButton>
              <Modal open={editComm} onClose={handleCloseEditModal}>
                <Paper>
                  <EditCommentModal
                    user={user}
                    customer={customer}
                    handleCloseEditModal={handleCloseEditModal}
                    com={com}
                    title={title}
                    comment={comment}
                  />
                </Paper>
              </Modal>
            </Box>
          )}
        </Box>
      );
    } else {
      return null;
    }
  });

  return (
    <Paper /* INFORMATION ABOUT CUSTOMER */
      sx={{
        width: { xxs: '90%', xs: '90%', sm: '90%', md: '90%' },
        background: `linear-gradient(to top left, ${theme.palette.background.medium}, ${theme.palette.secondary.main}  )`,
        mt: '2rem',
        p: '1rem',
      }}
    >
      {slic ? (
        <Box sx={{ width: '100%' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography /* CUSTOMER NAME */
              variant='h6'
              sx={{
                width: '100%',
                textAlign: 'center',
                textTransform: 'uppercase',
                mb: '1rem',
              }}
            >
              {!checked ? customer.name : customer.alphaSlic}
            </Typography>
            {session && (
              <Button /* ADD COMMENT BUTTON */
                variant='contained'
                color='secondary'
                size='small'
                sx={{ p: '.25rem .5rem', m: '0', minWidth: '0' }}
                onClick={handleAddComm}
              >
                <MapsUgcOutlinedIcon />
              </Button>
            )}
            <Modal open={openAddComm} onClose={handleCloseCommModal}>
              <Paper>
                <AddCommentModal
                  user={user}
                  customer={customer}
                  handleCloseCommModal={handleCloseCommModal}
                />
              </Paper>
            </Modal>
          </Box>

          <Box /* COMMENTS CONTAINER */
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-evenly',
              alingItems: 'center',
            }}
          >
            {session ? (
              customerComments
            ) : (
              <Typography textAlign='center'>
                Please Login to see comments
              </Typography>
            )}
          </Box>
        </Box>
      ) : user ? (
        <Typography textAlign='center'>Choose Slic to see comments</Typography>
      ) : (
        <Typography>Log in to see comments</Typography>
      )}
    </Paper>
  );
}
