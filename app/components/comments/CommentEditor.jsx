'use client';

import { Box, Button, Collapse, Paper } from '@mui/material';
import Placeholder from '@tiptap/extension-placeholder';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

function CommentEditor() {
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
          'max-h-48 min-h-[10rem] w-full border-none py-4 px-4 focus:outline-none',
      },
    },
  });

  return (
    <Paper
      elevation={0}
      sx={{
        width: '100%',
        transition: 'all 0.3s ease',
        bgcolor: 'grey.200',
        border: '1px solid #e0e0e0',
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
        }}
      >
        <Button variant='contained'>Submit</Button>
        <Button color='error' variant='contained'>
          Clear
        </Button>
      </Box>
    </Paper>
  );
}

export default CommentEditor;
