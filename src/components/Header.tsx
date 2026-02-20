import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTabs } from '../store/useTabs';
import GlobalSearch from './GlobalSearch';
import { Button } from './ui/button';
import {
    LogOut,
    Settings,
    Bell,
    Sun,
    Moon
} from 'lucide-react';
import React from 'react';

export default function Header() {
    const { signOut, user } = useAuth();
    const { clearActiveTab } = useTabs();
    const [isDark, setIsDark] = React.useState(document.documentElement.classList.contains('dark'));

    React.useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDark]);

    const toggleTheme = () => setIsDark(!isDark);

    return (
        <header className="h-7 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 flex items-center justify-between sticky top-0 z-50 transition-colors">
            {/* Left: Logo */}
            <div className="flex items-center h-full px-6 border-r border-gray-200 dark:border-gray-800 min-w-60">
                <Link
                    to="/"
                    className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                    onClick={() => clearActiveTab()}
                >
                    <h1 className="text-sm font-bold tracking-tight text-gray-600">
                        Repo
                    </h1>
                </Link>
            </div>

            {/* Middle: Search */}
            <div className="flex-1 h-full flex items-center justify-center">
                <GlobalSearch />
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 px-4 h-full border-l border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-0.5 mr-2">
                    <Button variant="ghost" size="icon" className="h-5 w-5 text-gray-500 hover:text-gray-800 dark:hover:text-white" onClick={toggleTheme}>
                        {isDark ? <Sun className="h-3 w-3" /> : <Moon className="h-3 w-3" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-5 w-5 text-gray-500 hover:text-gray-800 dark:hover:text-white">
                        <Bell className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-5 w-5 text-gray-500 hover:text-gray-800 dark:hover:text-white">
                        <Settings className="h-3 w-3" />
                    </Button>
                </div>

                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 hidden lg:block">
                        {user?.email?.split('@')[0] || 'User'}
                    </span>

                    <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1 text-gray-500 hover:text-red-600 hover:bg-red-50 px-1.5 h-5"
                        onClick={signOut}
                    >
                        <LogOut className="h-2.5 w-2.5" />
                        <span className="text-[9px] font-bold">Sign out</span>
                    </Button>
                </div>
            </div>
        </header>
    );
}
