import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Editor, { MenuBar } from '../components/Editor';
import { Button } from '../components/ui/button';
import { Save } from 'lucide-react';
import { useTabs } from '../store/useTabs';
import { usePages } from '../store/usePages';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

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

    const isNewDraft = id?.startsWith('draft-');
    const isEditable = isEditingMode || isNewDraft;

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
                // Create new page
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
                    fetchPages(user.id); // Refresh sidebar list
                    navigate(`/pages/${data.id}`, { replace: true });
                }
            } else {
                // Update existing page
                const { error } = await supabase
                    .from('pages')
                    .update({
                        title: title,
                        content: content,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', id);

                if (error) throw error;
                // Update local stores for immediate feedback
                updateTab(id, { title });
                updatePage(id, { title: title });
            }
            // Return to view mode after saving
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

    // Auto-save removed as per requirements

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
                            className="text-sm font-bold border-none shadow-none focus:ring-0 px-2 py-1 h-7 placeholder:text-gray-300 dark:placeholder:text-gray-700 flex-1 bg-gray-50 dark:bg-gray-800/50 rounded transition-colors w-full max-w-sm"
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
                            className="h-8 text-[11px] font-bold text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                        >
                            Edit
                        </Button>
                    )}
                    {isEditable && (
                        <Button
                            onClick={() => savePage()}
                            disabled={saving}
                            className="gap-2 h-8 text-[11px] font-bold px-4"
                        >
                            <Save className="h-3.5 w-3.5" />
                            {saving ? 'Saving...' : 'Save Draft'}
                        </Button>
                    )}
                </div>
            </div>

            {/* Ribbon Tier 2: RTE Tools */}
            <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 z-20 h-10 flex items-center shadow-sm">
                <div className="w-full">
                    {editorInstance && <MenuBar editor={editorInstance} />}
                </div>
            </div>

            <div className="flex-1 overflow-auto">
                <div className="max-w-[210mm] mx-auto py-8">
                    <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-800 min-h-[297mm] relative mb-20 rounded-t-sm shadow-none">
                        <div className="p-[2cm]">
                            <Editor
                                content={content}
                                editable={isEditable}
                                onReady={setEditorInstance}
                                onChange={(newContent) => setContent(newContent)}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
