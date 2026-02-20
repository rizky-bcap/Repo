import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface Page {
    id: string;
    title: string;
    parent_id: string | null;
    position: number;
}

interface PagesStore {
    pages: Page[];
    loading: boolean;
    fetchPages: (userId: string) => Promise<void>;
    addPage: (page: Page) => void;
    updatePage: (id: string, updates: Partial<Page>) => void;
    removePage: (id: string) => void;
    reorderPage: (id: string, newParentId: string | null, newPosition: number) => void;
}

export const usePages = create<PagesStore>((set) => ({
    pages: [],
    loading: false,
    fetchPages: async (userId: string) => {
        set({ loading: true });
        try {
            // First attempt: try with position column
            const { data, error } = await supabase
                .from('pages')
                .select('id, title, parent_id, position')
                .eq('user_id', userId)
                .order('position', { ascending: true });

            if (error) {
                // If it's a specific "column not found" error, retry without position
                if (error.code === '42703' || error.message.includes('position')) {
                    console.warn('Position column not found, falling back to created_at');
                    const { data: fallbackData, error: fallbackError } = await supabase
                        .from('pages')
                        .select('id, title, parent_id')
                        .eq('user_id', userId)
                        .order('created_at', { ascending: true });

                    if (fallbackError) throw fallbackError;
                    // Map data to include a default position for the frontend
                    set({ pages: (fallbackData || []).map((p, i) => ({ ...p, position: i })) });
                    return;
                }
                throw error;
            }
            set({ pages: data || [] });
        } catch (error) {
            console.error('Error fetching pages:', error);
        } finally {
            set({ loading: false });
        }
    },
    addPage: (page) => set((state) => ({ pages: [...state.pages, page] })),
    updatePage: (id, updates) =>
        set((state) => ({
            pages: state.pages.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        })),
    removePage: (id) =>
        set((state) => ({
            pages: state.pages.filter((p) => p.id !== id),
        })),
    reorderPage: (id, newParentId, newPosition) =>
        set((state) => ({
            pages: state.pages
                .map((p) => (p.id === id ? { ...p, parent_id: newParentId, position: newPosition } : p))
                .sort((a, b) => a.position - b.position),
        })),
}));
