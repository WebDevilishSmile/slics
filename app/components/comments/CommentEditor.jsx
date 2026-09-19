'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Box, Button, Paper } from '@mui/material';
import { EditorContent, useEditor } from '@tiptap/react';
import theme from '@/utils/theme';

import Placeholder from '@tiptap/extension-placeholder';
import StarterKit from '@tiptap/starter-kit';

function CommentEditor({ user, refetchComments, setShowEditor }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const numSlic = searchParams.get('slic');

  const [comment, setComment] = useState({
    numSlic: numSlic,
    userId: user.id,
    content: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleCommentChange = (value) => {
    setComment((prev) => {
      return {
        ...prev,
        content: value,
      };
    });
  };
  const handleCommentClear = () => {
    setComment((prev) => {
      return {
        ...prev,
        content: '',
      };
    });
    if (editor) {
      editor.commands.clearContent();
    }
  };
  const handleCommentSubmit = async () => {
    setSubmitting(true);
    try {
      const result = await fetch('/api/comment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(comment),
      });
      handleCommentClear();

      refetchComments();
      setShowEditor(false);
      router.refresh();
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const numSlic = searchParams.get('slic');
    setComment((prev) => {
      return {
        ...prev,
        numSlic: numSlic,
      };
    });
    handleCommentClear();
  }, [searchParams, numSlic]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Start typing your comment...',
      }),
    ],
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          'comment-surface comment-content max-h-48 min-h-[10rem] text-base w-full border-none py-4 px-4 focus:outline-none',
      },
    },
    onUpdate: ({ editor }) => {
      handleCommentChange(editor.getHTML());
    },
  });

  return (
    <Paper
      elevation={0}
      sx={{
        width: '100%',
        transition: 'all 0.3s ease',
        overflow: 'hidden',
        mb: '1rem',
      }}
    >
      <EditorContent editor={editor} />

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '1rem',
          px: '1rem',
          py: '1rem',
          bgcolor: 'background.comment',
        }}
      >
        <Button
          variant='contained'
          onClick={handleCommentSubmit}
          disabled={!comment.content || submitting}
        >
          Submit
        </Button>
        <Button
          color='error'
          variant='contained'
          onClick={handleCommentClear}
          disabled={submitting}
        >
          Clear
        </Button>
      </Box>
    </Paper>
  );
}

export default CommentEditor;
