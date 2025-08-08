'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Typography from '@tiptap/extension-typography';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemeClasses } from '@/hooks/useDesignTokens';
import { Button } from '@mond-design-system/theme';

interface TiptapEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

export function TiptapEditor({ content, onChange, placeholder = 'Start writing your poem...' }: TiptapEditorProps) {
  const { theme } = useTheme();
  const themeClasses = useThemeClasses();

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        paragraph: {
          HTMLAttributes: {
            class: 'my-0',
          },
        },
      }),
      TextStyle,
      Color,
      Typography,
    ],
    content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none min-h-[300px] p-4',
      },
    },
    parseOptions: {
      preserveWhitespace: 'full',
    },
  });

  if (!editor) {
    return <div className={`h-[400px] ${themeClasses.muted} animate-pulse rounded-lg`} />;
  }

  return (
    <div className={`border ${themeClasses.border} rounded-lg overflow-hidden ${themeClasses.background}`}>
      {/* Toolbar */}
      <div className={`flex items-center gap-2 p-3 border-b ${themeClasses.border} ${themeClasses.muted}/30`}>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant={editor.isActive('bold') ? 'primary' : 'ghost'}
            size="sm"
            isDarkMode={theme === 'dark'}
            onClick={() => editor.chain().focus().toggleBold().run()}
            disabled={!editor.can().chain().focus().toggleBold().run()}
          >
            B
          </Button>
          <Button
            type="button"
            variant={editor.isActive('italic') ? 'primary' : 'ghost'}
            size="sm"
            isDarkMode={theme === 'dark'}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            disabled={!editor.can().chain().focus().toggleItalic().run()}
          >
            I
          </Button>
          <Button
            type="button"
            variant={editor.isActive('underline') ? 'primary' : 'ghost'}
            size="sm"
            isDarkMode={theme === 'dark'}
            onClick={() => editor.chain().focus().toggleStrike().run()}
            disabled={!editor.can().chain().focus().toggleStrike().run()}
          >
            U
          </Button>
        </div>

        <div className={`w-px h-6 ${themeClasses.border}`} />

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant={editor.isActive({ textAlign: 'left' }) ? 'primary' : 'ghost'}
            size="sm"
            isDarkMode={theme === 'dark'}
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
          >
            ⬅️
          </Button>
          <Button
            type="button"
            variant={editor.isActive({ textAlign: 'center' }) ? 'primary' : 'ghost'}
            size="sm"
            isDarkMode={theme === 'dark'}
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
          >
            ↔️
          </Button>
          <Button
            type="button"
            variant={editor.isActive({ textAlign: 'right' }) ? 'primary' : 'ghost'}
            size="sm"
            isDarkMode={theme === 'dark'}
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
          >
            ➡️
          </Button>
        </div>

        <div className={`w-px h-6 ${themeClasses.border}`} />

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            isDarkMode={theme === 'dark'}
            onClick={() => {
              // Move cursor to the beginning of the line and insert spaces
              const { state } = editor;
              const { selection } = state;
              const { $from } = selection;
              
              // Find the start of the current paragraph
              const paragraphStart = $from.start();
              
              // Insert 4 spaces at the beginning of the paragraph
              editor.chain()
                .focus()
                .setTextSelection(paragraphStart)
                .insertContent('    ') // 4 regular spaces
                .run();
            }}
            title="Increase Indent"
          >
            ⇥
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            isDarkMode={theme === 'dark'}
            onClick={() => {
              // Remove spaces at the beginning of the current line
              const { state } = editor;
              const { selection } = state;
              const { $from } = selection;
              
              // Find the start of the current paragraph
              const paragraphStart = $from.start();
              const paragraph = $from.node();
              
              if (paragraph.type.name === 'paragraph') {
                const content = paragraph.textContent;
                // Check if line starts with spaces
                const leadingSpaces = content.match(/^(\s+)/);
                if (leadingSpaces) {
                  const spacesToRemove = Math.min(4, leadingSpaces[1].length);
                  // Remove up to 4 leading spaces
                  editor.chain()
                    .focus()
                    .setTextSelection({ from: paragraphStart, to: paragraphStart + spacesToRemove })
                    .deleteSelection()
                    .run();
                }
              }
            }}
            title="Decrease Indent"
          >
            ⇤
          </Button>
        </div>

        <div className={`w-px h-6 ${themeClasses.border}`} />

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant={editor.isActive('blockquote') ? 'primary' : 'ghost'}
            size="sm"
            isDarkMode={theme === 'dark'}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
          >
            ❝❞
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            isDarkMode={theme === 'dark'}
            onClick={() => editor.chain().focus().setHardBreak().run()}
          >
            ⤵️
          </Button>
        </div>
      </div>

      {/* Editor Content */}
      <div className="relative">
        <EditorContent 
          editor={editor} 
          className="prose prose-lg max-w-none [&_.ProseMirror]:min-h-[300px] [&_.ProseMirror]:p-4 [&_.ProseMirror]:outline-none [&_.ProseMirror]:font-sans [&_.ProseMirror]:leading-relaxed"
        />
        {editor.isEmpty && (
          <div className={`absolute top-4 left-4 ${themeClasses.mutedForeground} pointer-events-none`}>
            {placeholder}
          </div>
        )}
      </div>
    </div>
  );
}