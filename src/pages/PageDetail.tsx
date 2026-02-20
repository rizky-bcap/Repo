import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Editor from '../components/Editor';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Save } from 'lucide-react';
import { useTabs } from '../store/useTabs';
import { usePages } from '../store/usePages';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { exportToDocx } from '../lib/export';

export default function PageDetail() {
    const { id } = useParams<{ id: string }>();
    const [searchParams] = useSearchParams();
    const isEditingMode = searchParams.get('edit') === 'true';

    const { user } = useAuth();
    const navigate = useNavigate();
    const { addTab, removeTab, updateTab } = useTabs();
    const { fetchPages, updatePage } = usePages();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState<any>(null);
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
                updatePage(id, { title });
            }
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
            <div className="flex-1 overflow-auto">
                <div className="max-w-[210mm] mx-auto py-12 px-4 sm:px-0">
                    <div className="bg-white dark:bg-gray-900 shadow-xl border border-gray-200 dark:border-gray-800 min-h-[297mm] relative mb-12">
                        <div className="p-[2cm]">
                            <div className="mb-8">
                                <div className="flex items-center justify-between gap-4">
                                    {isEditable ? (
                                        <Input
                                            className="text-2xl font-bold border-none shadow-none focus-visible:ring-0 px-0 h-auto placeholder:text-gray-300 dark:placeholder:text-gray-700 flex-1 bg-transparent text-gray-900 dark:text-gray-100"
                                            placeholder="Untitled"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                        />
                                    ) : (
                                        <h1 className="text-2xl font-bold flex-1 text-gray-900 dark:text-gray-100">{title || 'Untitled'}</h1>
                                    )}

                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => exportToDocx(title, content)}
                                            className="h-8 text-[11px] font-bold"
                                        >
                                            Export
                                        </Button>
                                        {isEditable && (
                                            <Button
                                                onClick={() => savePage()}
                                                disabled={saving}
                                                className="gap-2 h-8 text-[11px] font-bold"
                                            >
                                                <Save className="h-3.5 w-3.5" />
                                                {saving ? 'Saving...' : 'Save'}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                                <div className="h-4 text-[10px] text-muted-foreground mt-1">
                                    {saving ? 'Saving changes...' : (isNewDraft ? 'Not saved yet' : (isEditable ? 'Editing mode' : 'Read-only view'))}
                                </div>
                            </div>

                            <Editor
                                content={content}
                                editable={isEditable}
                                onChange={(newContent) => setContent(newContent)}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
