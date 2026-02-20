import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTabs } from '../store/useTabs';
import TabBar from './TabBar';
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
        <header className="h-11 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex items-center justify-between sticky top-0 z-50 transition-colors">
            {/* Left: Logo */}
            <div className="flex items-center h-full px-6 border-r border-slate-200 dark:border-slate-800 min-w-60">
                <Link
                    to="/"
                    className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                    onClick={() => clearActiveTab()}
                >
                    <h1 className="text-lg font-bold tracking-tight text-slate-600">
                        Repostory
                    </h1>
                </Link>
            </div>

            {/* Middle: Tabs */}
            <div className="flex-1 h-full overflow-hidden">
                <TabBar />
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 px-4 h-full border-l border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-0.5 mr-2">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:text-slate-800 dark:hover:text-white" onClick={toggleTheme}>
                        {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:text-slate-800 dark:hover:text-white">
                        <Bell className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:text-slate-800 dark:hover:text-white">
                        <Settings className="h-3.5 w-3.5" />
                    </Button>
                </div>

                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 hidden lg:block">
                        {user?.email?.split('@')[0] || 'User'}
                    </span>

                    <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 px-2 h-7"
                        onClick={signOut}
                    >
                        <LogOut className="h-3 w-3" />
                        <span className="text-[10px] font-bold">Sign out</span>
                    </Button>
                </div>
            </div>
        </header>
    );
}
