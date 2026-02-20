import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTabs } from '../store/useTabs';
import { cn } from '../lib/utils';

export default function TabBar() {
    const { tabs, activeTabId, removeTab, setActiveTab } = useTabs();
    const navigate = useNavigate();

    if (tabs.length === 0) return null;

    const handleTabClick = (id: string) => {
        setActiveTab(id);
        navigate(`/pages/${id}`);
    };

    const handleCloseTab = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        removeTab(id);

        // Navigation logic after closing is handled in store or effect? 
        // Store updates activeTabId, we need to sync navigation.
        // Actually, store logic for removeTab updates activeTabId. 
        // We should listen to activeTabId changes in a layout effect, or just navigate here manually.
        // Let's rely on the component re-rendering with new activeTabId to trigger navigation? 
        // No, side effects belong in event handlers or useEffect.

        // Better: Helper function to get next tab is in store, but we can't easily access return value.
        // Simplest: Check store state after removal.
        // For now, let's just let the user stay on current page if they close background tab, 
        // or navigate if they close active tab.

        // Correct logic:
        // If closing active tab, store sets new active ID. We need to navigate to that new ID.
        // We can use a useEffect in this component to sync URL with activeTabId.
    };

    return (
        <div className="flex items-center overflow-x-auto no-scrollbar h-full">
            {tabs.map((tab) => (
                <div
                    key={tab.id}
                    onClick={() => handleTabClick(tab.id)}
                    className={cn(
                        "group flex items-center gap-2 px-3 h-full text-xs min-w-[100px] max-w-[160px] border-r border-slate-200 dark:border-slate-800 cursor-pointer select-none transition-colors relative",
                        activeTabId === tab.id
                            ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold"
                            : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900"
                    )}
                >
                    <span className="truncate flex-1">{tab.title || 'Untitled'}</span>
                    <button
                        onClick={(e) => handleCloseTab(e, tab.id)}
                        className={cn(
                            "p-0.5 rounded-sm opacity-0 group-hover:opacity-100 hover:bg-slate-200 dark:hover:bg-slate-800 transition-opacity",
                            activeTabId === tab.id && "opacity-100"
                        )}
                    >
                        <X className="h-3 w-3" />
                    </button>
                    {activeTabId === tab.id && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-600 dark:bg-slate-400" />
                    )}
                </div>
            ))}
        </div>
    );
}
