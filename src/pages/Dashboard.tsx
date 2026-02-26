import { useNavigate } from 'react-router-dom';
import { usePages } from '../store/usePages';
import { useTabs } from '../store/useTabs';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { FileText, Layers, GitBranch, ChevronRight } from 'lucide-react';

export default function Dashboard() {
    const { pages } = usePages();
    const { addTab } = useTabs();
    const navigate = useNavigate();

    const rootPages = pages.filter(p => !p.parent_id);
    const nestedPages = pages.filter(p => p.parent_id);

    const handleOpenPage = (id: string, title: string) => {
        addTab({ id, title });
        navigate(`/pages/${id}`);
    };

    return (
        <div className="h-full overflow-auto">
            <div className="max-w-4xl mx-auto px-8 py-8 space-y-6">

                {/* Stat Cards */}
                <div className="grid grid-cols-3 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2 pt-5 px-5">
                            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                Total Pages
                            </CardTitle>
                            <FileText className="h-4 w-4 text-gray-400" />
                        </CardHeader>
                        <CardContent className="px-5 pb-5">
                            <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{pages.length}</div>
                            <p className="text-xs text-gray-400 mt-1">pages in your workspace</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2 pt-5 px-5">
                            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                Root Pages
                            </CardTitle>
                            <Layers className="h-4 w-4 text-gray-400" />
                        </CardHeader>
                        <CardContent className="px-5 pb-5">
                            <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{rootPages.length}</div>
                            <p className="text-xs text-gray-400 mt-1">top-level documents</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2 pt-5 px-5">
                            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                Nested Pages
                            </CardTitle>
                            <GitBranch className="h-4 w-4 text-gray-400" />
                        </CardHeader>
                        <CardContent className="px-5 pb-5">
                            <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{nestedPages.length}</div>
                            <p className="text-xs text-gray-400 mt-1">sub-pages across workspace</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Pages List */}
                <Card>
                    <CardHeader className="px-5 pt-5 pb-3">
                        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                            All Pages
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-5 pb-5">
                        {pages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-32 rounded-md border border-dashed border-gray-200 dark:border-gray-700 text-gray-400 gap-2">
                                <FileText className="h-6 w-6 opacity-40" />
                                <span className="text-xs">No pages yet. Use the + button in the sidebar to create one.</span>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                {pages.map(page => (
                                    <button
                                        key={page.id}
                                        onClick={() => handleOpenPage(page.id, page.title)}
                                        className="w-full flex items-center gap-3 py-2.5 px-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group text-left"
                                    >
                                        <FileText className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                        <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 truncate group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">
                                            {page.title || 'Untitled'}
                                        </span>
                                        {page.parent_id && (
                                            <span className="text-[10px] text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded shrink-0">
                                                sub
                                            </span>
                                        )}
                                        <ChevronRight className="h-3.5 w-3.5 text-gray-300 dark:text-gray-600 group-hover:text-gray-400 shrink-0 transition-colors" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}
