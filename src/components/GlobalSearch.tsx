import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, Command } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function GlobalSearch() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const searchRef = useRef<HTMLDivElement>(null);

    // Keyboard shortcut (Ctrl + K)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(true);
                document.getElementById('global-search-input')?.focus();
            }
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Perform search
    useEffect(() => {
        const fetchResults = async () => {
            if (query.trim().length < 2) {
                setResults([]);
                return;
            }

            setIsLoading(true);
            try {
                // Search in pages table by title or content
                const { data, error } = await supabase
                    .from('pages')
                    .select('id, title, content')
                    .or(`title.ilike.%${query}%, content->>content.ilike.%${query}%`)
                    .limit(8);

                if (error) throw error;
                setResults(data || []);
            } catch (error) {
                console.error('Search error:', error);
            } finally {
                setIsLoading(false);
            }
        };

        const debounce = setTimeout(fetchResults, 300);
        return () => clearTimeout(debounce);
    }, [query]);

    const handleSelect = (id: string) => {
        navigate(`/pages/${id}`);
        setIsOpen(false);
        setQuery('');
    };

    return (
        <div className="relative w-full max-w-md mx-auto px-4" ref={searchRef}>
            <div className="relative group">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 group-focus-within:text-primary transition-colors" />
                <input
                    id="global-search-input"
                    type="text"
                    placeholder="Search anything..."
                    className="w-full h-7 pl-8 pr-12 text-[11px] bg-gray-100 dark:bg-gray-900 border-none rounded-md focus:ring-1 focus:ring-primary/20 transition-all font-medium placeholder:text-gray-500"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 pointer-events-none">
                    <kbd className="p-0.5 rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-[8px] font-bold text-gray-400">
                        <Command className="h-1.5 w-1.5 mb-0.5 inline-block mr-0.5" />
                        K
                    </kbd>
                </div>
            </div>

            {/* Results Dropdown */}
            {isOpen && (query.trim().length >= 2 || results.length > 0) && (
                <div className="absolute top-full left-0 right-0 mt-1 mx-4 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200 max-h-[300px] flex flex-col">
                    <div className="flex-1 overflow-auto p-1.5 custom-scrollbar">
                        {isLoading && results.length === 0 ? (
                            <div className="p-4 text-center">
                                <span className="text-[10px] text-gray-400 animate-pulse">Searching pages...</span>
                            </div>
                        ) : results.length > 0 ? (
                            <div className="space-y-0.5">
                                {results.map((page) => (
                                    <button
                                        key={page.id}
                                        onClick={() => handleSelect(page.id)}
                                        className="w-full flex items-start gap-2.5 p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors group text-left"
                                    >
                                        <div className="mt-0.5 p-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-400 group-hover:text-primary group-hover:bg-primary/5 transition-colors">
                                            <FileText className="h-3 w-3" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-[11px] font-bold text-gray-700 dark:text-gray-200 group-hover:text-primary transition-colors truncate">
                                                {page.title || 'Untitled'}
                                            </div>
                                            {/* Minimal content snippet if available */}
                                            {page.content && (
                                                <div className="text-[9px] text-gray-400 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                                                    Open this document
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : query.trim().length >= 2 ? (
                            <div className="p-4 text-center">
                                <span className="text-[10px] text-gray-400">No pages found matching "{query}"</span>
                            </div>
                        ) : null}
                    </div>
                    {results.length > 0 && (
                        <div className="p-2 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
                            <div className="flex items-center justify-between text-[8px] text-gray-400 font-bold uppercase tracking-wider">
                                <div className="flex items-center gap-1.5">
                                    <span>↑↓ to select</span>
                                    <span>↵ to jump</span>
                                </div>
                                <span>{results.length} results found</span>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
