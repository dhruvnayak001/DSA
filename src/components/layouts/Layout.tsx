import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import type { DSAQuestion, UserStats } from '@/types/types';

interface LayoutProps {
    children: React.ReactNode;
    questions: DSAQuestion[];
    dueToday: DSAQuestion[];
    stats: UserStats;
    theme: 'light' | 'dark';
    onToggleTheme: () => void;
    onAddQuestion?: () => void;
}

export function Layout({ children, dueToday, stats, theme, onToggleTheme, onAddQuestion }: LayoutProps) {
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <div className="flex min-h-screen w-full bg-background">
            <Sidebar
                stats={stats}
                dueCount={dueToday.length}
                mobileOpen={mobileOpen}
                onMobileClose={() => setMobileOpen(false)}
            />
            <div className="flex-1 min-w-0 overflow-x-hidden flex flex-col">
                <Header
                    theme={theme}
                    onToggleTheme={onToggleTheme}
                    onMobileMenuOpen={() => setMobileOpen(true)}
                    dueCount={dueToday.length}
                    onAddQuestion={onAddQuestion}
                />
                <main className="flex-1 p-4 md:p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
