import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useTabs } from '../store/useTabs';
import { usePages } from '../store/usePages';
import { Button } from './ui/button';
import { FileText, Plus, Trash2, ChevronRight, ChevronDown, Pencil } from 'lucide-react';
import { cn } from '../lib/utils';

// Types
interface Page {
    id: string;
    title: string;
    parent_id: string | null;
    position: number;
}

export default function PageTree() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { addTab } = useTabs();
    const { pages, loading, fetchPages, updatePage } = usePages();

    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [dropTarget, setDropTarget] = useState<{ id: string, type: 'inner' | 'before' | 'after' } | null>(null);

    const currentPath = window.location.pathname;

    useEffect(() => {
        if (user) fetchPages(user.id);
    }, [user, fetchPages]);

    const toggleExpanded = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
    };

    // --- Tree Construction ---
    const buildTree = (items: Page[], parentId: string | null = null): any[] => {
        return items
            .filter(item => item.parent_id === parentId)
            .sort((a, b) => a.position - b.position)
            .map(item => ({
                ...item,
                children: buildTree(items, item.id)
            }));
    };

    const tree = React.useMemo(() => buildTree(pages), [pages]);

    // --- Database Operations ---
    const handleMove = async (activeId: string, targetId: string | null, position: number) => {
        // Optimistic update
        usePages.getState().reorderPage(activeId, targetId, position);

        try {
            const { error } = await supabase
                .from('pages')
                .update({
                    parent_id: targetId,
                    position: position
                })
                .eq('id', activeId);

            if (error) {
                console.error('Error moving page:', error);
                // Revert on error? For now just log. fetchPages would fix it on refresh.
            }
            if (targetId) setExpanded(prev => ({ ...prev, [targetId]: true }));
        } catch (error) {
            console.error('Error moving page:', error);
        }
    };

    const createPage = async (parentId: string | null = null) => {
        if (!user) return;
        const maxPos = pages.length > 0 ? Math.max(...pages.map(p => p.position)) : 0;
        try {
            const { data, error } = await supabase
                .from('pages')
                .insert([{
                    user_id: user.id,
                    title: 'Untitled',
                    parent_id: parentId,
                    position: maxPos + 1
                }])
                .select()
                .single();

            if (error) throw error;
            if (data) {
                usePages.getState().addPage(data);
                addTab({ id: data.id, title: data.title });
                navigate(`/pages/${data.id}`);
                if (parentId) setExpanded(prev => ({ ...prev, [parentId]: true }));
            }
        } catch (error) {
            console.error('Error creating page:', error);
        }
    };

    const deletePage = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Are you sure?')) return;
        try {
            const { error } = await supabase.from('pages').delete().eq('id', id);
            if (error) throw error;
            usePages.getState().removePage(id);
            if (currentPath.includes(id)) navigate('/');
        } catch (error) {
            console.error('Error deleting page:', error);
        }
    };

    // --- Drag and Drop Handlers ---
    const onDragStart = (e: React.DragEvent, id: string) => {
        setDraggingId(id);
        e.dataTransfer.setData('text/plain', id);
        e.dataTransfer.effectAllowed = 'move';
        // Make drag image transparent or custom? Let's keep it default for now.
    };

    const onActiveDragOver = (e: React.DragEvent, id: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (draggingId === id) return;

        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const y = e.clientY - rect.top;
        const threshold = rect.height / 4; // 25% zone for top/bottom

        if (y < threshold) {
            setDropTarget({ id, type: 'before' });
        } else if (y > rect.height - threshold) {
            setDropTarget({ id, type: 'after' });
        } else {
            setDropTarget({ id, type: 'inner' });
        }
    };

    const onDragLeave = (e: React.DragEvent) => {
        // Only clear if we're actually leaving the element, not entering a child
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        if (
            e.clientX < rect.left ||
            e.clientX >= rect.right ||
            e.clientY < rect.top ||
            e.clientY >= rect.bottom
        ) {
            setDropTarget(null);
        }
    };

    const onDrop = async (e: React.DragEvent, targetId: string | null) => {
        e.preventDefault();
        e.stopPropagation();
        const activeId = draggingId;

        if (!activeId || activeId === targetId || !dropTarget) {
            setDraggingId(null);
            setDropTarget(null);
            return;
        }

        const activePage = pages.find(p => p.id === activeId);
        if (!activePage) return;

        // Prevent nesting inside self or children
        const isDescendant = (parentId: string, childId: string): boolean => {
            const childPage = pages.find(p => p.id === childId);
            if (!childPage || !childPage.parent_id) return false;
            if (childPage.parent_id === parentId) return true;
            return isDescendant(parentId, childPage.parent_id);
        };

        if (targetId && (activeId === targetId || isDescendant(activeId, targetId))) {
            setDraggingId(null);
            setDropTarget(null);
            return;
        }

        // Calculate New Position
        let newParentId: string | null = null;
        let newPosition = 0;

        if (targetId === null || (targetId === 'root' && dropTarget.type === 'inner')) {
            // Dropped on Root Empty Area
            newParentId = null;
            const rootPages = pages.filter(p => !p.parent_id && p.id !== activeId);
            newPosition = rootPages.length > 0 ? Math.max(...rootPages.map(p => p.position)) + 1 : 0;
        } else {
            const targetPage = pages.find(p => p.id === targetId);
            if (!targetPage) return;

            if (dropTarget.type === 'inner') {
                newParentId = targetId;
                const children = pages.filter(p => p.parent_id === targetId && p.id !== activeId);
                newPosition = children.length > 0 ? Math.max(...children.map(p => p.position)) + 1 : 0;
            } else {
                newParentId = targetPage.parent_id;
                const siblings = pages
                    .filter(p => p.parent_id === newParentId && p.id !== activeId)
                    .sort((a, b) => a.position - b.position);

                const targetIdx = siblings.findIndex(p => p.id === targetId);

                if (dropTarget.type === 'before') {
                    const prev = siblings[targetIdx - 1];
                    newPosition = prev ? (prev.position + targetPage.position) / 2 : targetPage.position - 1;
                } else { // dropTarget.type === 'after'
                    const next = siblings[targetIdx + 1];
                    newPosition = next ? (next.position + targetPage.position) / 2 : targetPage.position + 1;
                }
            }
        }

        await handleMove(activeId, newParentId, newPosition);

        setDraggingId(null);
        setDropTarget(null);
    };

    // --- Render Helpers ---
    const renderTreeNodes = (nodes: any[], level = 0) => {
        return nodes.map(node => {
            const isExpanded = expanded[node.id];
            const isActive = currentPath === `/pages/${node.id}`;
            const isTarget = dropTarget?.id === node.id;

            return (
                <div key={node.id} className="flex flex-col">
                    <div
                        draggable
                        onDragStart={(e) => onDragStart(e, node.id)}
                        onDragOver={(e) => onActiveDragOver(e, node.id)}
                        onDragLeave={onDragLeave}
                        onDrop={(e) => onDrop(e, node.id)}
                        onClick={() => {
                            addTab({ id: node.id, title: node.title });
                            navigate(`/pages/${node.id}`);
                        }}
                        style={{ paddingLeft: `${level * 12}px` }}
                        className={cn(
                            "group flex items-center gap-1 py-1 px-2 rounded-md transition-all cursor-pointer select-none relative",
                            isActive
                                ? "bg-white dark:bg-slate-800 text-primary shadow-sm border border-slate-200 dark:border-slate-700 font-medium"
                                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800",
                            isTarget && dropTarget?.type === 'inner' && "bg-primary/10 ring-1 ring-primary/30",
                            draggingId === node.id && "opacity-30 border-dashed border-primary"
                        )}
                    >
                        {/* Drag Indicator Lines */}
                        {isTarget && dropTarget?.type === 'before' && (
                            <div className="absolute -top-0.5 left-0 right-0 h-0.5 bg-primary rounded-full z-20 pointer-events-none" />
                        )}
                        {isTarget && dropTarget?.type === 'after' && (
                            <div className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-primary rounded-full z-20 pointer-events-none" />
                        )}

                        <div className="flex items-center flex-1 min-w-0">
                            {node.children.length > 0 ? (
                                <button
                                    onClick={(e) => toggleExpanded(node.id, e)}
                                    className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-500"
                                >
                                    {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                </button>
                            ) : (
                                <div className="w-4" />
                            )}
                            <div className="flex items-center gap-2 truncate">
                                <FileText className="h-3.5 w-3.5 shrink-0" />
                                <span className="truncate text-xs">{node.title || 'Untitled'}</span>
                            </div>
                        </div>

                        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    addTab({ id: node.id, title: node.title });
                                    navigate(`/pages/${node.id}?edit=true`);
                                }}
                                className="text-slate-400 hover:text-primary p-0.5 rounded hover:bg-slate-200"
                                title="Edit page"
                            >
                                <Pencil className="h-3 w-3" />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); createPage(node.id); }}
                                className="text-slate-400 hover:text-primary p-0.5 rounded hover:bg-slate-200"
                                title="Add subpage"
                            >
                                <Plus className="h-3 w-3" />
                            </button>
                            <button
                                onClick={(e) => deletePage(node.id, e)}
                                className="text-slate-400 hover:text-red-500 p-0.5 rounded hover:bg-red-50"
                                title="Delete"
                            >
                                <Trash2 className="h-3 w-3" />
                            </button>
                        </div>
                    </div>

                    {isExpanded && node.children.length > 0 && (
                        <div className="flex flex-col">
                            {renderTreeNodes(node.children, level + 1)}
                        </div>
                    )}
                </div>
            );
        });
    };

    return (
        <div className="flex flex-col h-full">
            <div className="px-4 mb-3 flex items-center justify-start py-1 transition-colors">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 text-slate-400 hover:text-slate-800 dark:hover:text-white mr-2"
                    onClick={() => createPage(null)}
                    title="New Root Page"
                >
                    <Plus className="h-3.5 w-3.5" />
                </Button>
                {/* Optional: Add a label here if needed, otherwise just keep it minimal */}
            </div>

            <div
                className="flex-1 overflow-y-auto px-2 space-y-0.5"
                onDragOver={(e) => {
                    if (pages.length === 0 || e.target === e.currentTarget) {
                        e.preventDefault();
                        setDropTarget({ id: 'root', type: 'inner' });
                    }
                }}
                onDragLeave={(e) => {
                    if (pages.length === 0 || e.target === e.currentTarget) {
                        setDropTarget(null);
                    }
                }}
                onDrop={(e) => {
                    if (pages.length === 0 || e.target === e.currentTarget) {
                        onDrop(e, null);
                    }
                }}
            >
                {loading ? (
                    <div className="text-[10px] text-slate-400 px-2 uppercase tracking-tight">Loading...</div>
                ) : (
                    renderTreeNodes(tree)
                )}
                {!loading && pages.length === 0 && (
                    <div className="text-[10px] text-slate-400 px-2 py-4 text-center uppercase border-2 border-dashed border-slate-200 rounded-lg">
                        No pages detected
                    </div>
                )}
            </div>
        </div>
    );
}
