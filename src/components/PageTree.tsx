import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useTabs } from '../store/useTabs';
import { usePages, type Page } from '../store/usePages';
import { Button } from './ui/button';
import { FileText, Plus, Trash2, ChevronRight, ChevronDown, Pencil, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface TreeNode extends Page {
    children: TreeNode[];
}

// Module-level helper — avoids redefining on every onDrop call
function isDescendant(pages: Page[], parentId: string, childId: string): boolean {
    const childPage = pages.find(p => p.id === childId);
    if (!childPage || !childPage.parent_id) return false;
    if (childPage.parent_id === parentId) return true;
    return isDescendant(pages, parentId, childPage.parent_id);
}

export default function PageTree() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { addTab } = useTabs();
    const { pages, loading, fetchPages } = usePages();

    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [dropTarget, setDropTarget] = useState<{ id: string; type: 'inner' | 'before' | 'after' } | null>(null);
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState<string | null>(null);

    const { pathname: currentPath } = useLocation();

    useEffect(() => {
        if (user) fetchPages(user.id);
    }, [user, fetchPages]);

    const toggleExpanded = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
    };

    // --- Tree Construction ---
    const buildTree = (items: Page[], parentId: string | null = null): TreeNode[] => {
        return items
            .filter(item => item.parent_id === parentId)
            .sort((a, b) => a.position - b.position)
            .map(item => ({
                ...item,
                children: buildTree(items, item.id),
            }));
    };

    const tree = React.useMemo(() => buildTree(pages), [pages]);

    // --- Database Operations ---
    const handleMove = async (activeId: string, targetId: string | null, position: number) => {
        // Save snapshot for revert on DB error
        const snapshot = usePages.getState().pages;
        // Optimistic update
        usePages.getState().reorderPage(activeId, targetId, position);

        try {
            const { error } = await supabase
                .from('pages')
                .update({ parent_id: targetId, position })
                .eq('id', activeId);

            if (error) {
                usePages.setState({ pages: snapshot });
                console.error('Error moving page:', error);
                return;
            }
            if (targetId) setExpanded(prev => ({ ...prev, [targetId]: true }));
        } catch (error) {
            usePages.setState({ pages: snapshot });
            console.error('Error moving page:', error);
        }
    };

    const createPage = async (parentId: string | null = null) => {
        if (!user || creating) return;
        setCreating(true);
        setCreateError(null);

        const maxPos = pages.length > 0 ? Math.max(...pages.map(p => p.position)) : 0;
        try {
            const { data, error } = await supabase
                .from('pages')
                .insert([{
                    user_id: user.id,
                    title: 'Untitled',
                    parent_id: parentId,
                    position: maxPos + 1,
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
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Failed to create page';
            setCreateError(msg);
            console.error('Error creating page:', err);
        } finally {
            setCreating(false);
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
        setCreateError(null);
        e.dataTransfer.setData('text/plain', id);
        e.dataTransfer.effectAllowed = 'move';
    };

    // Fires for any drag end — drop, cancel, or Escape — ensures state is always cleaned up
    const onDragEnd = useCallback(() => {
        setDraggingId(null);
        setDropTarget(null);
    }, []);

    const onActiveDragOver = (e: React.DragEvent, id: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (draggingId === id) return;

        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const y = e.clientY - rect.top;
        const threshold = rect.height / 4;

        if (y < threshold) {
            setDropTarget({ id, type: 'before' });
        } else if (y > rect.height - threshold) {
            setDropTarget({ id, type: 'after' });
        } else {
            setDropTarget({ id, type: 'inner' });
        }
    };

    // relatedTarget-based check: only clears when cursor truly leaves the element
    const onDragLeave = (e: React.DragEvent) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
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

        if (!pages.find(p => p.id === activeId)) return;

        // Prevent dropping into self or own descendants
        if (targetId && (activeId === targetId || isDescendant(pages, activeId, targetId))) {
            setDraggingId(null);
            setDropTarget(null);
            return;
        }

        let newParentId: string | null = null;
        let newPosition = 0;

        if (targetId === null || (targetId === 'root' && dropTarget.type === 'inner')) {
            // Dropped onto root empty area
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
                    newPosition = prev
                        ? (prev.position + targetPage.position) / 2
                        : targetPage.position - 1;
                } else {
                    const next = siblings[targetIdx + 1];
                    newPosition = next
                        ? (next.position + targetPage.position) / 2
                        : targetPage.position + 1;
                }
            }
        }

        await handleMove(activeId, newParentId, newPosition);

        setDraggingId(null);
        setDropTarget(null);
    };

    // --- Render ---
    const renderTreeNodes = (nodes: TreeNode[], level = 0) => {
        return nodes.map(node => {
            const isExpanded = expanded[node.id];
            const isActive = currentPath === `/pages/${node.id}`;
            const isTarget = dropTarget?.id === node.id;

            return (
                <div key={node.id} className="flex flex-col">
                    <div
                        draggable
                        onDragStart={(e) => onDragStart(e, node.id)}
                        onDragEnd={onDragEnd}
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
                                ? "bg-white dark:bg-gray-800 text-primary shadow-sm border border-gray-200 dark:border-gray-700 font-medium"
                                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800",
                            isTarget && dropTarget?.type === 'inner' && "bg-primary/10 ring-1 ring-primary/30",
                            draggingId === node.id && "opacity-30 border-dashed border-primary"
                        )}
                    >
                        {/* Drop indicator lines */}
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
                                    className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-500"
                                >
                                    {isExpanded
                                        ? <ChevronDown className="h-3 w-3" />
                                        : <ChevronRight className="h-3 w-3" />}
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
                                className="text-gray-400 hover:text-primary p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                                title="Edit page"
                            >
                                <Pencil className="h-3 w-3" />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); createPage(node.id); }}
                                className="text-gray-400 hover:text-primary p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                                title="Add subpage"
                            >
                                <Plus className="h-3 w-3" />
                            </button>
                            <button
                                onClick={(e) => deletePage(node.id, e)}
                                className="text-gray-400 hover:text-red-500 p-0.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
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
            {/* New page button */}
            <div className="px-3 mb-2 pt-1">
                <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start h-7 px-2 text-xs text-gray-400 hover:text-gray-800 dark:hover:text-white gap-1.5"
                    onClick={() => createPage(null)}
                    disabled={creating}
                    title="New page"
                >
                    {creating
                        ? <Loader2 className="h-3 w-3 animate-spin" />
                        : <Plus className="h-3 w-3" />}
                    New page
                </Button>
            </div>

            {/* Error feedback */}
            {createError && (
                <div className="mx-3 mb-2 px-2 py-1.5 text-[10px] text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded border border-red-200 dark:border-red-800 leading-tight">
                    {createError}
                </div>
            )}

            {/* Page tree */}
            <div
                className="flex-1 overflow-y-auto px-2 space-y-0.5"
                onDragOver={(e) => {
                    if (pages.length === 0 || e.target === e.currentTarget) {
                        e.preventDefault();
                        setDropTarget({ id: 'root', type: 'inner' });
                    }
                }}
                onDragLeave={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
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
                    <div className="text-[10px] text-gray-400 px-2 uppercase tracking-tight">Loading...</div>
                ) : (
                    renderTreeNodes(tree)
                )}
                {!loading && pages.length === 0 && (
                    <div className="text-[10px] text-gray-400 px-2 py-4 text-center uppercase border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                        No pages yet
                    </div>
                )}
            </div>
        </div>
    );
}
