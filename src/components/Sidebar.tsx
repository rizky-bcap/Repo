import PageTree from './PageTree';

export default function Sidebar() {
    return (
        <aside className="w-60 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col transition-colors overflow-hidden">
            <div className="flex-1 overflow-hidden py-4">
                <PageTree />
            </div>
        </aside>
    );
}
