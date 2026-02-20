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

export const MenuBar = ({ editor }: { editor: any }) => {
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
        <div className="flex items-center gap-1.5 px-6 bg-white dark:bg-gray-900 sticky top-0 z-10 flex-nowrap h-10 scrollbar-hide overflow-x-auto w-full">
            <div className="flex items-center gap-1.5 shrink-0">
                <select
                    className="h-8 px-2 border border-gray-200 dark:border-gray-800 rounded text-[11px] bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none transition-colors"
                    style={{ fontFamily: editor.getAttributes('textStyle').fontFamily }}
                    onChange={(e) => setFontFamily(e.target.value)}
                    value={editor.getAttributes('textStyle').fontFamily || 'default'}
                >
                    <option value="default">Default Font</option>
                    <option value="Calibri, sans-serif">Calibri</option>
                    <option value="Arial, sans-serif">Arial</option>
                    <option value="Roboto, sans-serif">Roboto</option>
                    <option value="'Times New Roman', serif">Times New Roman</option>
                </select>
                <div className="w-px h-6 bg-gray-200 dark:bg-gray-800 mx-0.5" />
                <select
                    className="h-8 px-2 border border-gray-200 dark:border-gray-800 rounded text-[11px] bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none transition-colors"
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
            </div>

            <div className="w-px h-6 bg-gray-200 dark:bg-gray-800 mx-1 shrink-0" />

            <div className="flex items-center gap-0.5 shrink-0">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    disabled={!editor.can().chain().focus().toggleBold().run()}
                    className={cn("h-8 w-8", editor.isActive('bold') ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400')}
                >
                    <Bold className="h-5 w-5" />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    disabled={!editor.can().chain().focus().toggleItalic().run()}
                    className={cn("h-8 w-8", editor.isActive('italic') ? 'bg-gray-100 dark:bg-gray-800' : '')}
                >
                    <Italic className="h-5 w-5" />
                </Button>
            </div>

            <div className="w-px h-6 bg-gray-200 dark:bg-gray-800 mx-1 shrink-0" />

            <div className="flex items-center gap-0.5 shrink-0">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    className={cn("h-8 w-8", editor.isActive('heading', { level: 1 }) ? 'bg-gray-100 dark:bg-gray-800' : '')}
                >
                    <Heading1 className="h-5 w-5" />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    className={cn("h-8 w-8", editor.isActive('heading', { level: 2 }) ? 'bg-gray-100 dark:bg-gray-800' : '')}
                >
                    <Heading2 className="h-5 w-5" />
                </Button>
            </div>

            <div className="w-px h-6 bg-gray-200 dark:bg-gray-800 mx-1 shrink-0" />

            <div className="flex items-center gap-0.5 shrink-0">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={cn("h-8 w-8", editor.isActive('bulletList') ? 'bg-gray-100 dark:bg-gray-800' : '')}
                >
                    <List className="h-5 w-5" />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className={cn("h-8 w-8", editor.isActive('orderedList') ? 'bg-gray-100 dark:bg-gray-800' : '')}
                >
                    <ListOrdered className="h-5 w-5" />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    className={cn("h-8 w-8", editor.isActive('blockquote') ? 'bg-gray-100 dark:bg-gray-800' : '')}
                >
                    <Quote className="h-5 w-5" />
                </Button>
            </div>
        </div>
    );
};

export default function Editor({ content, onChange, onReady, editable = true }: EditorProps & { onReady?: (editor: any) => void }) {
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
        onCreate: ({ editor }) => {
            if (onReady) onReady(editor);
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm dark:prose-invert focus:outline-none max-w-none',
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
            "flex flex-col h-full",
            !editable && "bg-transparent shadow-none"
        )}>
            {!onReady && editable && <MenuBar editor={editor} />}
            <EditorContent editor={editor} className="flex-1 overflow-auto bg-white dark:bg-gray-900" />
        </div>
    );
}
