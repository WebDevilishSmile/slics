'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Box, Button, Paper } from '@mui/material';
import { EditorContent, useEditor } from '@tiptap/react';

import Placeholder from '@tiptap/extension-placeholder';
import StarterKit from '@tiptap/starter-kit';

function CommentEditor({ user, refetchComments, setShowEditor }) {
  const searchParams = useSearchParams();
  const numSlic = searchParams.get('slic');

  const [comment, setComment] = useState({
    numSlic: numSlic,
    userId: user.id,
    content: '',
  });

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
    } catch (error) {
      console.error('Error submitting comment:', error);
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
          'max-h-48 min-h-[10rem] text-base w-full border-none py-4 px-4 focus:outline-none bg-transparent',
      },
    },
    onUpdate: ({ editor }) => {
      handleCommentChange(editor.getHTML());
    },
  });

  return (
    <Paper
      elevation={1}
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
          bgcolor: 'transparent',
        }}
      >
        <Button
          variant='contained'
          onClick={handleCommentSubmit}
          disabled={!comment.content}
        >
          Submit
        </Button>
        <Button color='error' variant='contained' onClick={handleCommentClear}>
          Clear
        </Button>
      </Box>
    </Paper>
  );
}

export default CommentEditor;
