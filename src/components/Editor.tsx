import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle } from '@tiptap/extension-text-style';
import { FontFamily } from '@tiptap/extension-font-family';
import { Extension } from '@tiptap/core';
import { Button } from './ui/button';
import { Bold, Italic, List, ListOrdered, Heading1, Heading2, Quote } from 'lucide-react';
import { cn } from '../lib/utils';
import { useEffect } from 'react';

// Custom Font Size Extension
const FontSize = Extension.create({
    name: 'fontSize',
    addOptions() {
        return {
            types: ['textStyle'],
        };
    },
    addGlobalAttributes() {
        return [
            {
                types: this.options.types,
                attributes: {
                    fontSize: {
                        default: null,
                        parseHTML: element => element.style.fontSize.replace(/['"]+/g, ''),
                        renderHTML: attributes => {
                            if (!attributes.fontSize) {
                                return {};
                            }
                            return {
                                style: `font-size: ${attributes.fontSize}`,
                            };
                        },
                    },
                },
            },
        ];
    },
    addCommands() {
        return {
            setFontSize: fontSize => ({ chain }) => {
                return chain()
                    .setMark('textStyle', { fontSize })
                    .run();
            },
            unsetFontSize: () => ({ chain }) => {
                return chain()
                    .setMark('textStyle', { fontSize: null })
                    .removeEmptyTextStyle()
                    .run();
            },
        };
    },
});

interface EditorProps {
    content: any;
    onChange: (content: any) => void;
    editable?: boolean;
}

const MenuBar = ({ editor }: { editor: any }) => {
    if (!editor) {
        return null;
    }

    const setFontSize = (size: string) => {
        if (size === 'default') {
            editor.chain().focus().unsetFontSize().run();
        } else {
            editor.chain().focus().setFontSize(size).run();
        }
    };

    const setFontFamily = (font: string) => {
        if (font === 'default') {
            editor.chain().focus().unsetFontFamily().run();
        } else {
            editor.chain().focus().setFontFamily(font).run();
        }
    };

    return (
        <div className="flex items-center gap-1 border-b border-gray-200 dark:border-gray-800 p-2 bg-white dark:bg-gray-900 sticky top-0 z-10 flex-wrap">
            <select
                className="h-8 px-2 border border-gray-200 dark:border-gray-800 rounded text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none"
                style={{ fontFamily: editor.getAttributes('textStyle').fontFamily }}
                onChange={(e) => setFontFamily(e.target.value)}
                value={editor.getAttributes('textStyle').fontFamily || 'default'}
            >
                <option value="default">Font</option>
                <option value="Calibri, sans-serif">Calibri</option>
                <option value="Arial, sans-serif">Arial</option>
                <option value="Roboto, sans-serif">Roboto</option>
                <option value="'Times New Roman', serif">Times New Roman</option>
            </select>
            <div className="w-px h-6 bg-gray-200 dark:bg-gray-800 mx-1" />
            <select
                className="h-8 px-2 border border-gray-200 dark:border-gray-800 rounded text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none"
                onChange={(e) => setFontSize(e.target.value)}
                value={editor.getAttributes('textStyle').fontSize || 'default'}
            >
                <option value="default">Size</option>
                <option value="8px">8px</option>
                <option value="10px">10px</option>
                <option value="12px">12px</option>
                <option value="14px">14px</option>
                <option value="16px">16px</option>
                <option value="18px">18px</option>
                <option value="20px">20px</option>
                <option value="24px">24px</option>
            </select>
            <div className="w-px h-6 bg-gray-200 dark:bg-gray-800 mx-1" />
            <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleBold().run()}
                disabled={!editor.can().chain().focus().toggleBold().run()}
                className={cn(editor.isActive('bold') ? 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400')}
            >
                <Bold className="h-4 w-4" />
            </Button>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                disabled={!editor.can().chain().focus().toggleItalic().run()}
                className={cn(editor.isActive('italic') ? 'bg-gray-200' : '')}
            >
                <Italic className="h-4 w-4" />
            </Button>
            <div className="w-px h-6 bg-gray-200 mx-2" />
            <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                className={cn(editor.isActive('heading', { level: 1 }) ? 'bg-gray-200' : '')}
            >
                <Heading1 className="h-4 w-4" />
            </Button>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={cn(editor.isActive('heading', { level: 2 }) ? 'bg-gray-200' : '')}
            >
                <Heading2 className="h-4 w-4" />
            </Button>
            <div className="w-px h-6 bg-gray-200 mx-2" />
            <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={cn(editor.isActive('bulletList') ? 'bg-gray-200' : '')}
            >
                <List className="h-4 w-4" />
            </Button>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={cn(editor.isActive('orderedList') ? 'bg-gray-200' : '')}
            >
                <ListOrdered className="h-4 w-4" />
            </Button>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                className={cn(editor.isActive('blockquote') ? 'bg-gray-200' : '')}
            >
                <Quote className="h-4 w-4" />
            </Button>
        </div>
    );
};

export default function Editor({ content, onChange, editable = true }: EditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit,
            TextStyle,
            FontFamily,
            FontSize,
        ],
        content: content,
        editable: editable,
        onUpdate: ({ editor }) => {
            onChange(editor.getJSON());
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm dark:prose-invert focus:outline-none min-h-[500px] p-6',
            },
        },
    });

    // Sync content if it changes externally (e.g. loading from DB)
    useEffect(() => {
        if (editor && content && !editor.isFocused) {
            // Check if content is different to avoid cursor jumps or loops is hard with JSON
            // For now, we only set content if editor is empty or on initial load logic handled by parent
            // Better approach: Parent only passes initialContent, or we compare deep equality.
            // Here we assume content prop updates only when switching pages.
            editor.commands.setContent(content);
        }
    }, [content, editor]);

    // Sync editable state
    useEffect(() => {
        if (editor) {
            editor.setEditable(editable);
        }
    }, [editable, editor]);

    return (
        <div className={cn(
            "border rounded-md bg-white dark:bg-gray-900 shadow-sm overflow-hidden flex flex-col h-full border-gray-200 dark:border-gray-800",
            !editable && "border-transparent shadow-none bg-transparent"
        )}>
            {editable && <MenuBar editor={editor} />}
            <EditorContent editor={editor} className="flex-1 overflow-auto bg-white dark:bg-gray-900" />
        </div>
    );
}
