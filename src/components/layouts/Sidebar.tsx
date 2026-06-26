import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    BookOpen,
    Clock,
    BarChart3,
    Brain,
    Settings,
    Zap,
    ChevronLeft,
    ChevronRight,
    Flame,
    Trophy,
    Award,
    X,
    LogOut,
    User,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import type { UserStats } from '@/types/types';
import { Badge } from '@/components/ui/badge';

interface SidebarProps {
    stats: UserStats;
    dueCount: number;
    mobileOpen?: boolean;
    onMobileClose?: () => void;
}

const NAV_ITEMS = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/questions', label: 'Question Bank', icon: BookOpen },
    { path: '/revision', label: 'Revision Queue', icon: Clock },
    { path: '/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/mistakes', label: 'Mistake Intel', icon: Brain },
    { path: '/badges', label: 'Badges', icon: Award },
    { path: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    { path: '/settings', label: 'Settings', icon: Settings },
];

function SidebarContent({
    collapsed,
    stats,
    dueCount,
    onNavClick,
}: {
    collapsed: boolean;
    stats: UserStats;
    dueCount: number;
    onNavClick?: () => void;
}) {
    const { user, signOut } = useAuth();
    const location = useLocation();

    return (
        <div className="flex flex-col h-full">
            {/* Logo */}
            <div className={cn('flex items-center gap-3 px-4 py-5 border-b border-sidebar-border', collapsed && 'justify-center px-2')}>
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
                    <Zap className="w-4 h-4 text-primary-foreground" />
                </div>
                <AnimatePresence>
                    {!collapsed && (
                        <motion.div
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: 'auto' }}
                            exit={{ opacity: 0, width: 0 }}
                            transition={{ duration: 0.15 }}
                            className="overflow-hidden"
                        >
                            <p className="text-sm font-bold text-sidebar-accent-foreground whitespace-nowrap leading-tight">DSA Tracker</p>
                            <p className="text-xs text-sidebar-foreground whitespace-nowrap">Pro</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* XP / Level bar */}
            {!collapsed && (
                <div className="px-4 py-3 border-b border-sidebar-border">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-sidebar-foreground">Level {stats.level}</span>
                        <span className="text-xs text-sidebar-foreground">{stats.totalXP} XP</span>
                    </div>
                    <div className="h-1.5 bg-sidebar-accent rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-primary rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${((stats.totalXP % 100) / 100) * 100}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                        />
                    </div>
                    {stats.currentStreak > 0 && (
                        <div className="flex items-center gap-1 mt-2">
                            <Flame className="w-3.5 h-3.5 text-warning" />
                            <span className="text-xs text-warning font-medium">{stats.currentStreak} day streak</span>
                        </div>
                    )}
                </div>
            )}

            {/* Nav */}
            <nav className="flex-1 py-3 px-2 space-y-0.5">
                {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
                    const isActive = path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);
                    const isDue = path === '/revision' && dueCount > 0;
                    return (
                        <NavLink
                            key={path}
                            to={path}
                            onClick={onNavClick}
                            className={cn(
                                'group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-150',
                                collapsed ? 'justify-center px-2' : '',
                                isActive
                                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                                    : 'text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground'
                            )}
                        >
                            <Icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-primary' : 'text-sidebar-foreground group-hover:text-sidebar-accent-foreground')} />
                            <AnimatePresence>
                                {!collapsed && (
                                    <motion.span
                                        initial={{ opacity: 0, width: 0 }}
                                        animate={{ opacity: 1, width: 'auto' }}
                                        exit={{ opacity: 0, width: 0 }}
                                        className="flex-1 truncate whitespace-nowrap overflow-hidden"
                                    >
                                        {label}
                                    </motion.span>
                                )}
                            </AnimatePresence>
                            {isDue && !collapsed && (
                                <Badge className="ml-auto bg-destructive text-destructive-foreground text-[10px] px-1.5 py-0 h-4 min-w-4 flex items-center justify-center">
                                    {dueCount}
                                </Badge>
                            )}
                            {isDue && collapsed && (
                                <span className="absolute right-1.5 top-1.5 w-2 h-2 bg-destructive rounded-full" />
                            )}
                        </NavLink>
                    );
                })}
            </nav>

            {/* Achievements teaser */}
            {!collapsed && (
                <div className="px-4 py-3 border-t border-sidebar-border">
                    <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-warning shrink-0" />
                        <div className="min-w-0">
                            <p className="text-xs font-medium text-sidebar-accent-foreground truncate">
                                {stats.badges?.filter((b) => b.unlockedAt).length || 0} Badges Earned
                            </p>
                            <p className="text-[11px] text-sidebar-foreground truncate">Keep revising to unlock more!</p>
                        </div>
                    </div>
                </div>
            )}

            {/* User info + logout */}
            <div className={cn('border-t border-sidebar-border px-3 py-3', collapsed ? 'flex justify-center' : '')}>
                {!collapsed ? (
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <User className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <p className="text-xs font-medium text-sidebar-accent-foreground truncate flex-1">
                            {user?.username ?? 'User'}
                        </p>
                        <button
                            onClick={() => signOut()}
                            className="p-1.5 rounded text-sidebar-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                            title="Log out"
                        >
                            <LogOut className="w-3.5 h-3.5" />
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => signOut()}
                        className="p-1.5 rounded text-sidebar-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        title="Log out"
                    >
                        <LogOut className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>
        </div>
    );
}

export function Sidebar({ stats, dueCount, mobileOpen, onMobileClose }: SidebarProps) {
    const [collapsed, setCollapsed] = useState(false);

    return (
        <>
            {/* Desktop sidebar */}
            <motion.aside
                animate={{ width: collapsed ? 64 : 220 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="relative hidden lg:flex flex-col bg-sidebar shrink-0 border-r border-sidebar-border overflow-hidden"
                style={{ minHeight: '100vh' }}
            >
                <SidebarContent collapsed={collapsed} stats={stats} dueCount={dueCount} />
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="absolute -right-3 top-16 z-10 w-6 h-6 rounded-full bg-sidebar-border border border-sidebar-border flex items-center justify-center hover:bg-sidebar-accent transition-colors"
                    aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    {collapsed ? (
                        <ChevronRight className="w-3 h-3 text-sidebar-foreground" />
                    ) : (
                        <ChevronLeft className="w-3 h-3 text-sidebar-foreground" />
                    )}
                </button>
            </motion.aside>

            {/* Mobile overlay */}
            <AnimatePresence>
                {mobileOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={onMobileClose}
                            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                        />
                        <motion.aside
                            initial={{ x: -220 }}
                            animate={{ x: 0 }}
                            exit={{ x: -220 }}
                            transition={{ duration: 0.2, ease: 'easeInOut' }}
                            className="fixed inset-y-0 left-0 z-50 w-[220px] bg-sidebar border-r border-sidebar-border lg:hidden flex flex-col"
                        >
                            <div className="absolute top-4 right-3">
                                <button
                                    onClick={onMobileClose}
                                    className="p-1.5 rounded-md text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <SidebarContent collapsed={false} stats={stats} dueCount={dueCount} onNavClick={onMobileClose} />
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
