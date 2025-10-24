import React from 'react';
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Code,
  Highlighter,
  Italic,
  Link2,
  Link2Off,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  Strikethrough,
  Underline,
  Undo2,
  Heading1,
  Heading2,
  Heading3,
} from 'lucide-react';
import ToolbarButton from './ToolbarButton';
import { ToolbarGroup } from './ToolbarGroup';
import { ToolbarDivider } from './ToolbarDivider';

export const EditorToolbar = ({ editor }) => {
  if (!editor) {
    return null;
  }

  const selectionEmpty = editor.state?.selection?.empty ?? true;

  const handleSetLink = () => {
    if (!editor) return;

    const previousUrl = editor.getAttributes('link').href || '';

    if (typeof window === 'undefined') {
      return;
    }

    const result = window.prompt('Enter a URL', previousUrl);

    if (result === null) {
      return;
    }

    const url = result.trim();

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const handleUnsetLink = () => {
    editor.chain().focus().unsetLink().run();
  };

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border bg-muted/40 px-3 py-2">
      <div className="flex basis-full min-w-0 flex-wrap items-center gap-2 sm:basis-auto sm:flex-1 sm:flex-nowrap sm:overflow-x-auto">
        <ToolbarGroup>
          <ToolbarButton
            icon={Bold}
            label="Bold"
            isActive={editor.isActive('bold')}
            onClick={() => editor.chain().focus().toggleBold().run()}
            disabled={!editor.can().chain().focus().toggleBold().run()}
          />
          <ToolbarButton
            icon={Italic}
            label="Italic"
            isActive={editor.isActive('italic')}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            disabled={!editor.can().chain().focus().toggleItalic().run()}
          />
          <ToolbarButton
            icon={Underline}
            label="Underline"
            isActive={editor.isActive('underline')}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            disabled={!editor.can().chain().focus().toggleUnderline().run()}
          />
          <ToolbarButton
            icon={Strikethrough}
            label="Strikethrough"
            isActive={editor.isActive('strike')}
            onClick={() => editor.chain().focus().toggleStrike().run()}
            disabled={!editor.can().chain().focus().toggleStrike().run()}
          />
          <ToolbarButton
            icon={Code}
            label="Code"
            isActive={editor.isActive('code')}
            onClick={() => editor.chain().focus().toggleCode().run()}
            disabled={!editor.can().chain().focus().toggleCode().run()}
          />
          <ToolbarButton
            icon={Highlighter}
            label="Highlight"
            isActive={editor.isActive('highlight')}
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            disabled={!editor.can().chain().focus().toggleHighlight().run()}
          />
        </ToolbarGroup>

        <ToolbarGroup>
          <ToolbarButton
            icon={Heading1}
            label="Heading 1"
            isActive={editor.isActive('heading', { level: 1 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            disabled={!editor.can().chain().focus().toggleHeading({ level: 1 }).run()}
          />
          <ToolbarButton
            icon={Heading2}
            label="Heading 2"
            isActive={editor.isActive('heading', { level: 2 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            disabled={!editor.can().chain().focus().toggleHeading({ level: 2 }).run()}
          />
          <ToolbarButton
            icon={Heading3}
            label="Heading 3"
            isActive={editor.isActive('heading', { level: 3 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            disabled={!editor.can().chain().focus().toggleHeading({ level: 3 }).run()}
          />
        </ToolbarGroup>

        <ToolbarGroup>
          <ToolbarButton
            icon={List}
            label="Bullet list"
            isActive={editor.isActive('bulletList')}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            disabled={!editor.can().chain().focus().toggleBulletList().run()}
          />
          <ToolbarButton
            icon={ListOrdered}
            label="Numbered list"
            isActive={editor.isActive('orderedList')}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            disabled={!editor.can().chain().focus().toggleOrderedList().run()}
          />
          <ToolbarButton
            icon={Quote}
            label="Blockquote"
            isActive={editor.isActive('blockquote')}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            disabled={!editor.can().chain().focus().toggleBlockquote().run()}
          />
          <ToolbarButton
            icon={Minus}
            label="Horizontal rule"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            disabled={!editor.can().chain().focus().setHorizontalRule().run()}
          />
        </ToolbarGroup>

        <ToolbarGroup>
          <ToolbarButton
            icon={AlignLeft}
            label="Align left"
            isActive={editor.isActive({ textAlign: 'left' })}
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
          />
          <ToolbarButton
            icon={AlignCenter}
            label="Align center"
            isActive={editor.isActive({ textAlign: 'center' })}
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
          />
          <ToolbarButton
            icon={AlignRight}
            label="Align right"
            isActive={editor.isActive({ textAlign: 'right' })}
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
          />
          <ToolbarButton
            icon={AlignJustify}
            label="Justify"
            isActive={editor.isActive({ textAlign: 'justify' })}
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          />
        </ToolbarGroup>

        <ToolbarGroup>
          <ToolbarButton
            icon={Link2}
            label="Insert link"
            isActive={editor.isActive('link')}
            onClick={handleSetLink}
            disabled={selectionEmpty}
          />
          <ToolbarButton
            icon={Link2Off}
            label="Remove link"
            onClick={handleUnsetLink}
            disabled={!editor.isActive('link')}
          />
        </ToolbarGroup>
      </div>

      <div className="flex basis-full flex-col gap-2 sm:basis-auto sm:flex-row sm:items-center sm:gap-2">
        <ToolbarDivider
          orientation="horizontal"
          className="w-full sm:hidden"
        />
        <ToolbarDivider className="hidden h-6 sm:block sm:mx-1" />
        <ToolbarGroup className="w-full justify-end sm:ml-auto sm:w-auto sm:justify-start">
          <ToolbarButton
            icon={Undo2}
            label="Undo"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().chain().focus().undo().run()}
          />
          <ToolbarButton
            icon={Redo2}
            label="Redo"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().chain().focus().redo().run()}
          />
        </ToolbarGroup>
      </div>
    </div>
  );
};

export default EditorToolbar;
