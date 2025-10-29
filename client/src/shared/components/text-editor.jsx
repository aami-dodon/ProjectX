import { useEffect, useMemo } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import { mergeAttributes } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import Highlight from "@tiptap/extension-highlight";
import Heading from "@tiptap/extension-heading";
import Paragraph from "@tiptap/extension-paragraph";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import Blockquote from "@tiptap/extension-blockquote";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { lowlight } from "lowlight";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code2,
  Link2,
  Unlink,
  Highlighter,
  Minus,
  Undo,
  Redo,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
} from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { Separator } from "@/shared/components/ui/separator";
import { cn } from "@/shared/lib/utils";

const StyledHeading = Heading.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      class: {
        default: null,
      },
    };
  },
  renderHTML({ node, HTMLAttributes }) {
    const level = node.attrs.level;
    const className =
      level === 1
        ? "text-4xl font-bold text-primary dark:text-primary"
        : level === 2
          ? "text-2xl font-semibold text-primary dark:text-primary"
          : "text-xl font-medium text-primary dark:text-primary";

    return [
      `h${level}`,
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        class: className,
      }),
    ];
  },
});

const StyledParagraph = Paragraph.configure({
  HTMLAttributes: {
    class: "text-base text-foreground dark:text-foreground",
  },
});

const StyledBulletList = BulletList.configure({
  HTMLAttributes: {
    class: "list-disc pl-6 text-foreground dark:text-foreground",
  },
});

const StyledOrderedList = OrderedList.configure({
  HTMLAttributes: {
    class: "list-decimal pl-6 text-foreground dark:text-foreground",
  },
});

const StyledBlockquote = Blockquote.configure({
  HTMLAttributes: {
    class:
      "border-l-4 border-muted-foreground dark:border-muted-foreground pl-4 italic text-muted-foreground dark:text-muted-foreground",
  },
});

const StyledCodeBlock = CodeBlockLowlight.configure({
  lowlight,
  HTMLAttributes: {
    class:
      "bg-muted dark:bg-zinc-900 text-sm font-mono text-foreground dark:text-zinc-100 p-3 rounded-md block overflow-x-auto",
  },
});

function createDefaultExtensions(placeholder) {
  return [
    StarterKit.configure({
      heading: false,
      paragraph: false,
      bulletList: false,
      orderedList: false,
      blockquote: false,
      codeBlock: false,
    }),
    StyledHeading.configure({
      levels: [1, 2, 3],
    }),
    StyledParagraph,
    StyledBulletList,
    StyledOrderedList,
    StyledBlockquote,
    StyledCodeBlock,
    Underline,
    Highlight,
    Link.configure({
      openOnClick: false,
      autolink: true,
      linkOnPaste: true,
      HTMLAttributes: {
        class: "text-primary underline underline-offset-2",
      },
    }),
    TextAlign.configure({
      types: ["heading", "paragraph"],
    }),
    Placeholder.configure({
      placeholder,
    }),
  ];
}

function ToolbarButton({ editor, icon, label, onClick, isActive, disabled }) {
  const Icon = icon
  const isButtonDisabled = !editor || disabled;

  return (
    <Button
      type="button"
      size="icon-sm"
      variant={isActive ? "secondary" : "ghost"}
      className={cn(
        "h-8 w-8",
        isActive && "bg-accent text-accent-foreground hover:bg-accent/90"
      )}
      onClick={onClick}
      disabled={isButtonDisabled}
    >
      <Icon className="size-4" />
      <span className="sr-only">{label}</span>
    </Button>
  );
}

export function TextEditor({
  value = "",
  onChange,
  placeholder = "Write something...",
  extensions,
  className,
  editorClassName,
  disabled = false,
}) {
  const resolvedExtensions = useMemo(() => {
    if (extensions && extensions.length) {
      return extensions;
    }

    return createDefaultExtensions(placeholder);
  }, [extensions, placeholder]);

  const editor = useEditor(
    {
      extensions: resolvedExtensions,
      content: value || "",
      editable: !disabled,
      editorProps: {
        attributes: {
          class:
            "prose dark:prose-invert focus:outline-none max-w-none text-sm leading-relaxed",
        },
      },
      onUpdate({ editor: tiptapEditor }) {
        onChange?.(tiptapEditor.getHTML());
      },
    },
    [resolvedExtensions]
  );

  useEffect(() => {
    if (!editor) {
      return;
    }

    if (value !== editor.getHTML()) {
      editor.commands.setContent(value || "", false);
    }
  }, [editor, value]);

  useEffect(() => {
    if (!editor) {
      return;
    }

    editor.setEditable(!disabled);
  }, [editor, disabled]);

  if (!editor) {
    return null;
  }

  const toggleLink = () => {
    if (disabled) {
      return;
    }

    if (typeof window === "undefined") {
      return;
    }

    if (editor.isActive("link")) {
      editor.chain().focus().unsetLink().run();
      return;
    }

    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("Enter URL", previousUrl || "");

    if (url === null) {
      return;
    }

    if (url === "") {
      editor.chain().focus().unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  return (
    <div className={cn("rounded-lg border bg-background", className)}>
      <div className="flex flex-wrap items-center gap-1 border-b bg-muted/40 p-2">
        <ToolbarButton
          editor={editor}
          icon={Bold}
          label="Bold"
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive("bold")}
          disabled={
            disabled || !editor.can().chain().focus().toggleBold().run()
          }
        />
        <ToolbarButton
          editor={editor}
          icon={Italic}
          label="Italic"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive("italic")}
          disabled={
            disabled || !editor.can().chain().focus().toggleItalic().run()
          }
        />
        <ToolbarButton
          editor={editor}
          icon={UnderlineIcon}
          label="Underline"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive("underline")}
          disabled={
            disabled || !editor.can().chain().focus().toggleUnderline().run()
          }
        />
        <ToolbarButton
          editor={editor}
          icon={Strikethrough}
          label="Strikethrough"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive("strike")}
          disabled={
            disabled || !editor.can().chain().focus().toggleStrike().run()
          }
        />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              className="h-8 w-8"
              disabled={disabled}
            >
              <Heading1 className="size-4" />
              <span className="sr-only">Headings</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-40">
            {[1, 2, 3].map((level) => (
              <DropdownMenuItem
                key={level}
                onSelect={(event) => {
                  event.preventDefault();
                  if (disabled) return;
                  editor.chain().focus().toggleHeading({ level }).run();
                }}
                className={cn(
                  "flex items-center gap-2",
                  editor.isActive("heading", { level }) && "bg-accent/60"
                )}
                disabled={disabled}
              >
                {level === 1 && <Heading1 className="size-4" />}
                {level === 2 && <Heading2 className="size-4" />}
                {level === 3 && <Heading3 className="size-4" />}
                <span>Heading {level}</span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault();
                if (disabled) return;
                editor.chain().focus().setParagraph().run();
              }}
              className={cn(
                "flex items-center gap-2",
                editor.isActive("paragraph") && "bg-accent/60"
              )}
              disabled={disabled}
            >
              <span className="font-medium">Paragraph</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Separator orientation="vertical" className="mx-1 h-6" />

        <ToolbarButton
          editor={editor}
          icon={List}
          label="Bullet list"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive("bulletList")}
          disabled={
            disabled || !editor.can().chain().focus().toggleBulletList().run()
          }
        />
        <ToolbarButton
          editor={editor}
          icon={ListOrdered}
          label="Ordered list"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive("orderedList")}
          disabled={
            disabled || !editor.can().chain().focus().toggleOrderedList().run()
          }
        />
        <ToolbarButton
          editor={editor}
          icon={Quote}
          label="Blockquote"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive("blockquote")}
          disabled={
            disabled || !editor.can().chain().focus().toggleBlockquote().run()
          }
        />
        <ToolbarButton
          editor={editor}
          icon={Code2}
          label="Code block"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          isActive={editor.isActive("codeBlock")}
          disabled={
            disabled || !editor.can().chain().focus().toggleCodeBlock().run()
          }
        />

        <Separator orientation="vertical" className="mx-1 h-6" />

        <ToolbarButton
          editor={editor}
          icon={AlignLeft}
          label="Align left"
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          isActive={editor.isActive({ textAlign: "left" })}
          disabled={disabled}
        />
        <ToolbarButton
          editor={editor}
          icon={AlignCenter}
          label="Align center"
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          isActive={editor.isActive({ textAlign: "center" })}
          disabled={disabled}
        />
        <ToolbarButton
          editor={editor}
          icon={AlignRight}
          label="Align right"
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          isActive={editor.isActive({ textAlign: "right" })}
          disabled={disabled}
        />
        <ToolbarButton
          editor={editor}
          icon={AlignJustify}
          label="Justify"
          onClick={() => editor.chain().focus().setTextAlign("justify").run()}
          isActive={editor.isActive({ textAlign: "justify" })}
          disabled={disabled}
        />

        <Separator orientation="vertical" className="mx-1 h-6" />

        <ToolbarButton
          editor={editor}
          icon={Highlighter}
          label="Highlight"
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          isActive={editor.isActive("highlight")}
          disabled={
            disabled || !editor.can().chain().focus().toggleHighlight().run()
          }
        />
        <ToolbarButton
          editor={editor}
          icon={Link2}
          label="Link"
          onClick={toggleLink}
          isActive={editor.isActive("link")}
          disabled={disabled}
        />
        <ToolbarButton
          editor={editor}
          icon={Unlink}
          label="Remove link"
          onClick={() => editor.chain().focus().unsetLink().run()}
          disabled={disabled || !editor.isActive("link")}
        />
        <ToolbarButton
          editor={editor}
          icon={Minus}
          label="Horizontal rule"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          disabled={disabled}
        />

        <Separator orientation="vertical" className="mx-1 h-6" />

        <ToolbarButton
          editor={editor}
          icon={Undo}
          label="Undo"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={disabled || !editor.can().chain().focus().undo().run()}
        />
        <ToolbarButton
          editor={editor}
          icon={Redo}
          label="Redo"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={disabled || !editor.can().chain().focus().redo().run()}
        />
      </div>
      <EditorContent
        editor={editor}
        className={cn(
          "min-h-[12rem] px-4 py-3 text-sm",
          editorClassName
        )}
      />
    </div>
  );
}

export default TextEditor;
