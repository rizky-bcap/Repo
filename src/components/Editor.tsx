import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle } from '@tiptap/extension-text-style';
import { FontFamily } from '@tiptap/extension-font-family';
import { Extension, Node } from '@tiptap/core';
import { Button } from './ui/button';
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

// Custom Page Break Extension
const PageBreak = Node.create({
    name: 'pageBreak',
    group: 'block',
    atom: true,
    draggable: false,
    selectable: true,

    parseHTML() {
        return [
            {
                tag: 'div[data-page-break]',
            },
        ];
    },

    renderHTML() {
        return ['div', { 'data-page-break': '', class: 'page-break' }];
    },

    addKeyboardShortcuts() {
        return {
            'Shift-Enter': () => {
                return this.editor.chain().insertContent({ type: this.name }).run();
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
        <div className="flex items-center gap-1.5 px-6 bg-white dark:bg-gray-900 sticky top-0 z-10 flex-nowrap h-10 overflow-hidden w-full">
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
                    <span className="font-bold text-sm">B</span>
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    disabled={!editor.can().chain().focus().toggleItalic().run()}
                    className={cn("h-8 w-8", editor.isActive('italic') ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400')}
                >
                    <span className="italic text-sm">I</span>
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
            PageBreak,
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
