import { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { useTabs } from '../store/useTabs';

export default function DashboardLayout() {
    const { activeTabId } = useTabs();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (activeTabId && !location.pathname.includes(activeTabId)) {
            navigate(`/pages/${activeTabId}`);
        } else if (!activeTabId && location.pathname !== '/' && location.pathname.includes('/pages/')) {
            navigate('/');
        }
    }, [activeTabId, navigate, location.pathname]);

    return (
        <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors">
            <Header />
            <div className="flex flex-1 overflow-hidden">
                <Sidebar />
                <main className="flex-1 flex flex-col overflow-hidden">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
