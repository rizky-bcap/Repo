import { create } from 'zustand';

interface Tab {
    id: string;
    title: string;
}

interface TabsStore {
    tabs: Tab[];
    activeTabId: string | null;
    addTab: (tab: Tab) => void;
    removeTab: (id: string) => void;
    updateTab: (id: string, updates: Partial<Tab>) => void;
    setActiveTab: (id: string) => void;
    clearActiveTab: () => void;
    reorderTabs: (newTabs: Tab[]) => void;
}

export const useTabs = create<TabsStore>((set) => ({
    tabs: [],
    activeTabId: null,
    addTab: (tab) =>
        set((state) => {
            if (state.tabs.find((t) => t.id === tab.id)) {
                return { activeTabId: tab.id };
            }
            return { tabs: [...state.tabs, tab], activeTabId: tab.id };
        }),
    removeTab: (id) =>
        set((state) => {
            const newTabs = state.tabs.filter((t) => t.id !== id);
            let newActiveId = state.activeTabId;

            if (state.activeTabId === id) {
                newActiveId = newTabs.length > 0 ? newTabs[newTabs.length - 1].id : null;
            }

            return { tabs: newTabs, activeTabId: newActiveId };
        }),
    updateTab: (id, updates) =>
        set((state) => ({
            tabs: state.tabs.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        })),
    setActiveTab: (id) => set({ activeTabId: id }),
    clearActiveTab: () => set({ activeTabId: null }),
    reorderTabs: (newTabs) => set({ tabs: newTabs }),
}));
