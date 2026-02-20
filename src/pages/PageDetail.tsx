import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Editor, { MenuBar } from '../components/Editor';
import { Button } from '../components/ui/button';

import { useTabs } from '../store/useTabs';
import { usePages } from '../store/usePages';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

// A4 page dimensions in pixels (at 96 DPI)
const A4_PAGE_HEIGHT_PX = 1122.52;
const A4_MARGIN_PX = 75.59;
const A4_USABLE_HEIGHT_PX = A4_PAGE_HEIGHT_PX - (A4_MARGIN_PX * 2);

export default function PageDetail() {
    const { id } = useParams<{ id: string }>();
    const [searchParams, setSearchParams] = useSearchParams();
    const isEditingMode = searchParams.get('edit') === 'true';

    const { user } = useAuth();
    const navigate = useNavigate();
    const { addTab, removeTab, updateTab } = useTabs();
    const { fetchPages, updatePage } = usePages();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState<any>(null);
    const [editorInstance, setEditorInstance] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [pageCount, setPageCount] = useState(1);

    const contentRef = useRef<HTMLDivElement>(null);
    const observerRef = useRef<ResizeObserver | null>(null);

    const isNewDraft = id?.startsWith('draft-');
    const isEditable = isEditingMode || isNewDraft;

    // Observe content height and calculate page count
    const setupObserver = useCallback(() => {
        if (observerRef.current) {
            observerRef.current.disconnect();
        }

        observerRef.current = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const contentHeight = entry.contentRect.height;
                const pages = Math.max(1, Math.ceil(contentHeight / A4_USABLE_HEIGHT_PX));
                setPageCount(pages);
            }
        });

        const editorElement = contentRef.current?.querySelector('.ProseMirror');
        if (editorElement) {
            observerRef.current.observe(editorElement);
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(setupObserver, 100);
        return () => {
            clearTimeout(timer);
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [setupObserver, editorInstance]);

    useEffect(() => {
        fetchPage();
    }, [id]);

    const fetchPage = async () => {
        if (!id) return;

        if (isNewDraft) {
            setTitle('New Draft');
            setContent({ type: 'doc', content: [] });
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('pages')
                .select('title, content')
                .eq('id', id)
                .single();

            if (error) throw error;
            if (data) {
                setTitle(data.title);
                setContent(data.content);
            }
        } catch (error) {
            console.error('Error fetching page:', error);
        } finally {
            setLoading(false);
        }
    };

    const savePage = async () => {
        if (!user || !id) return;
        setSaving(true);
        try {
            if (isNewDraft) {
                const { data, error } = await supabase
                    .from('pages')
                    .insert([{
                        user_id: user.id,
                        title: title || 'Untitled',
                        content: content
                    }])
                    .select()
                    .single();

                if (error) throw error;
                if (data) {
                    removeTab(id);
                    addTab({ id: data.id, title: data.title });
                    fetchPages(user.id);
                    navigate(`/pages/${data.id}`, { replace: true });
                }
            } else {
                const { error } = await supabase
                    .from('pages')
                    .update({
                        title: title,
                        content: content,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', id);

                if (error) throw error;
                updateTab(id, { title });
                updatePage(id, { title: title });
            }
            setSearchParams({});
        } catch (error) {
            console.error('Error saving page:', error);
        } finally {
            setSaving(false);
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                savePage();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [title, content, id, isNewDraft]);

    if (loading) {
        return <div className="p-8">Loading...</div>;
    }

    return (
        <div className="h-full flex flex-col bg-[#f8f9fa] dark:bg-gray-950 overflow-hidden">
            {/* Ribbon Tier 1: Title & Actions */}
            <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 z-30 h-10 flex items-center shadow-sm px-6">
                <div className="flex-1 flex items-center">
                    {isEditable ? (
                        <input
                            className="text-sm font-bold border-none shadow-none focus:ring-0 focus:outline-none outline-none px-0 py-1 h-7 placeholder:text-gray-300 dark:placeholder:text-gray-700 flex-1 bg-transparent transition-colors w-full"
                            placeholder="Untitled Page"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    ) : (
                        <h1 className="text-sm font-bold text-gray-900 dark:text-gray-100">{title || 'Untitled'}</h1>
                    )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    {!isEditable && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSearchParams({ edit: 'true' })}
                            className="h-8 text-[11px] font-bold text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                            Edit
                        </Button>
                    )}
                    {isEditable && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => savePage()}
                            disabled={saving}
                            className="h-8 text-[11px] font-bold text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                            {saving ? 'Saving...' : 'Save'}
                        </Button>
                    )}
                </div>
            </div>

            {/* Ribbon Tier 2: RTE Tools - only in edit mode */}
            {isEditable && (
                <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 z-20 h-10 flex items-center shadow-sm">
                    <div className="w-full">
                        {editorInstance && <MenuBar editor={editorInstance} />}
                    </div>
                </div>
            )}

            {/* Document Workspace - Paginated A4 */}
            <div className="flex-1 overflow-auto">
                <div className="max-w-[210mm] mx-auto py-8">
                    <div className="paginated-document" ref={contentRef}>
                        {Array.from({ length: pageCount }, (_, i) => (
                            <div key={i} className="a4-page">
                                {i === 0 ? (
                                    <div className="a4-page-content">
                                        <Editor
                                            content={content}
                                            editable={isEditable}
                                            onReady={setEditorInstance}
                                            onChange={(newContent) => setContent(newContent)}
                                        />
                                    </div>
                                ) : (
                                    <div className="a4-page-content" />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
