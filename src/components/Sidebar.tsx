import PageTree from './PageTree';

export default function Sidebar() {
    return (
        <aside className="w-60 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-colors overflow-hidden">
            <div className="flex-1 overflow-hidden py-4">
                <PageTree />
            </div>
        </aside>
    );
}
