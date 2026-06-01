import { useLocation } from 'react-router-dom';
import { Menu, Sun, Moon, Plus, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';


const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
    '/': { title: 'Dashboard', subtitle: 'Overview of your DSA journey' },
    '/questions': { title: 'Question Bank', subtitle: 'Manage all tracked questions' },
    '/revision': { title: 'Revision Queue', subtitle: 'Questions due for revision' },
    '/analytics': { title: 'Analytics', subtitle: 'Visualize your progress' },
    '/mistakes': { title: 'Mistake Intelligence', subtitle: 'Detect patterns in your errors' },
    '/settings': { title: 'Settings', subtitle: 'Preferences & data management' },
};

interface HeaderProps {
    theme: 'light' | 'dark';
    onToggleTheme: () => void;
    onMobileMenuOpen: () => void;
    dueCount: number;
    onAddQuestion?: () => void;
}

export function Header({ theme, onToggleTheme, onMobileMenuOpen, dueCount, onAddQuestion }: HeaderProps) {
    const location = useLocation();
    const key = Object.keys(PAGE_TITLES).find((k) =>
        k === '/' ? location.pathname === '/' : location.pathname.startsWith(k)
    ) ?? '/';
    const { title, subtitle } = PAGE_TITLES[key];

    return (
        <header className="sticky top-0 z-30 flex items-center gap-4 h-14 px-4 md:px-6 bg-background/80 backdrop-blur border-b border-border">
            {/* Mobile menu */}
            <Button
                variant="ghost"
                size="icon"
                className="lg:hidden shrink-0 text-muted-foreground hover:text-foreground"
                onClick={onMobileMenuOpen}
                aria-label="Open menu"
            >
                <Menu className="w-5 h-5" />
            </Button>

            {/* Title */}
            <div className="flex-1 min-w-0">
                <h1 className="text-sm font-semibold text-foreground truncate text-balance">{title}</h1>
                <p className="text-xs text-muted-foreground truncate hidden sm:block">{subtitle}</p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
                {/* Due badge */}
                {dueCount > 0 && (
                    <div className="relative hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-destructive/10 border border-destructive/20 rounded-full">
                        <Bell className="w-3 h-3 text-destructive" />
                        <span className="text-xs font-medium text-destructive">{dueCount} due</span>
                    </div>
                )}

                {/* Add Question */}
                {location.pathname === '/questions' && onAddQuestion && (
                    <Button
                        size="sm"
                        onClick={onAddQuestion}
                        className="gap-1.5 h-8 text-xs font-medium"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Add Question</span>
                    </Button>
                )}

                {/* Theme toggle */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onToggleTheme}
                    className={cn('h-8 w-8 text-muted-foreground hover:text-foreground')}
                    aria-label="Toggle theme"
                >
                    {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </Button>
            </div>
        </header>
    );
}
