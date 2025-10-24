import React, { useEffect } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import CharacterCount from '@tiptap/extension-character-count';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import { cn } from '../../lib/utils';
import { EditorToolbar } from './toolbar';

const DEFAULT_PLACEHOLDER = 'Start capturing the evidence narrative…';

const baseExtensions = ({ placeholder, characterLimit }) => [
  StarterKit.configure({
    heading: { levels: [1, 2, 3] },
    bulletList: { keepMarks: true, keepAttributes: false },
    orderedList: { keepMarks: true, keepAttributes: false },
  }),
  Underline,
  Highlight,
  Link.configure({
    autolink: true,
    linkOnPaste: true,
    openOnClick: false,
    HTMLAttributes: {
      class: 'text-primary underline underline-offset-4 font-medium hover:text-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    },
  }),
  TextAlign.configure({
    types: ['heading', 'paragraph'],
  }),
  Placeholder.configure({
    placeholder: placeholder || DEFAULT_PLACEHOLDER,
  }),
  CharacterCount.configure({
    limit: characterLimit ?? 0,
  }),
];

export const SimpleEditor = ({
  value = '',
  onChange,
  placeholder = DEFAULT_PLACEHOLDER,
  className,
  characterLimit,
  editable = true,
  footer,
}) => {
  const editor = useEditor(
    {
      extensions: baseExtensions({ placeholder, characterLimit }),
      content: value,
      editable,
      editorProps: {
        attributes: {
          class:
            'prose prose-sm max-w-none min-h-[200px] px-4 py-3 focus:outline-none',
        },
      },
      onUpdate: ({ editor }) => {
        if (onChange) {
          onChange(editor.getHTML());
        }
      },
    },
    [placeholder, characterLimit]
  );

  useEffect(() => {
    if (!editor) {
      return;
    }

    if (typeof editable === 'boolean') {
      editor.setEditable(editable);
    }
  }, [editor, editable]);

  useEffect(() => {
    if (!editor || typeof value !== 'string') {
      return;
    }

    const currentHTML = editor.getHTML();

    if (value === '' && editor.isEmpty) {
      return;
    }

    if (value !== '' && currentHTML === value) {
      return;
    }

    if (value === '') {
      editor.commands.clearContent(true);
    } else {
      editor.commands.setContent(value, false);
    }
  }, [editor, value]);

  const characters = editor?.storage?.characterCount?.characters?.() ?? 0;
  const limit = editor?.storage?.characterCount?.options?.limit ?? characterLimit ?? 0;
  const showLimit = limit > 0;

  return (
    <div className={cn('flex flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm', className)}>
      {editable && <EditorToolbar editor={editor} />}
      <div className="relative">
        <EditorContent editor={editor} />
      </div>
      {(footer || editor) && (
        <div className="flex items-center justify-between gap-3 border-t border-border bg-muted/30 px-4 py-2 text-xs text-muted-foreground">
          <span>
            {showLimit ? `${characters} / ${limit} characters` : `${characters} characters`}
          </span>
          {footer}
        </div>
      )}
    </div>
  );
};

export default SimpleEditor;
