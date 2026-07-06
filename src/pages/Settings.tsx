import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon, Download, Upload, Trash2, Database, Palette, Shield, ArrowUpFromLine, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { questionsApi } from '@/api/questions';
import { statsApi } from '@/api/stats';
import { settingsApi } from '@/api/settings';
import { toast } from 'sonner';
import type { DSAQuestion, StoredData } from '@/types/types';
import { useAuth } from '@/contexts/AuthContext';

interface SettingsProps {
    theme: 'light' | 'dark';
    onToggleTheme: () => void;
    questionCount: number;
    onImport: (questions: DSAQuestion[]) => void;
    onReset: () => void;
}

function SettingSection({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
    return (
        <Card className="border-border/50 shadow-card">
            <CardHeader className="pb-3 pt-4 px-5">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-balance">
                    <Icon className="w-4 h-4 text-primary" />
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5 space-y-4">
                {children}
            </CardContent>
        </Card>
    );
}

export function Settings({ theme, onToggleTheme, questionCount, onImport, onReset }: SettingsProps) {
    const { user, refreshUser } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [importing, setImporting] = useState(false);
    const [recalculating, setRecalculating] = useState(false);
    const [migrating, setMigrating] = useState(false);
    const [migrationDone, setMigrationDone] = useState(false);

    // ── Export: fetch all questions from API → download JSON ──────────────────
    async function handleExport() {
        try {
            const questions = await questionsApi.getAll();
            const data: StoredData = {
                questions,
                stats: user?.stats ?? { currentStreak: 0, longestStreak: 0, lastRevisionDate: '', totalXP: 0, level: 1, achievements: [] },
                settings: user?.settings ?? { theme: 'light' },
                savedFilters: [],
            };
            const json = JSON.stringify(data, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `dsa-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
            toast.success('Data exported successfully!', { description: 'Your backup file has been downloaded.' });
        } catch {
            toast.error('Export failed', { description: 'Could not fetch data from the server.' });
        }
    }

    // ── Import: upload JSON → send to API ─────────────────────────────────────
    function handleImportClick() {
        fileInputRef.current?.click();
    }

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        setImporting(true);
        const reader = new FileReader();
        reader.onload = async (ev) => {
            try {
                const content = ev.target?.result as string;
                const parsed = JSON.parse(content) as StoredData;
                if (!Array.isArray(parsed.questions)) throw new Error('Invalid format');

                await questionsApi.importQuestions(parsed.questions);
                if (parsed.stats) await statsApi.update(parsed.stats);
                if (parsed.settings) await settingsApi.update(parsed.settings);

                onImport(parsed.questions);
                toast.success('Data imported!', { description: 'Your questions have been restored.' });
            } catch {
                toast.error('Import failed', { description: 'Invalid file format. Please use a valid backup file.' });
            } finally {
                setImporting(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        };
        reader.readAsText(file);
    }

    // ── Reset: delete all questions via API ───────────────────────────────────
    async function handleReset() {
        try {
            await questionsApi.importQuestions([]);
            onReset();
            toast.success('All data reset', { description: 'Your tracker has been cleared.' });
        } catch {
            toast.error('Reset failed');
        }
    }

    // ── Recalculate stats from revision history ───────────────────────────────
    async function handleRecalculate() {
        setRecalculating(true);
        try {
            const result = await statsApi.recalculate();
            await refreshUser();
            toast.success('Stats recalculated!', {
                description: `${result.stats.totalDaysActive} active days · ${result.stats.currentStreak} day streak.`,
            });
        } catch {
            toast.error('Recalculate failed');
        } finally {
            setRecalculating(false);
        }
    }

    // ── localStorage Migration ────────────────────────────────────────────────
    async function handleMigrateFromLocalStorage() {
        setMigrating(true);
        try {
            const rawQuestions = localStorage.getItem('dsa_questions');
            const rawStats = localStorage.getItem('dsa_stats');
            const rawSettings = localStorage.getItem('dsa_settings');

            if (!rawQuestions) {
                toast.info('No localStorage data found to migrate.');
                setMigrating(false);
                return;
            }

            const questions: DSAQuestion[] = JSON.parse(rawQuestions);
            if (questions.length > 0) {
                await questionsApi.importQuestions(questions);
                onImport(questions);
            }
            if (rawStats) {
                const stats = JSON.parse(rawStats);
                await statsApi.update(stats);
            }
            if (rawSettings) {
                const settings = JSON.parse(rawSettings);
                await settingsApi.update(settings);
            }

            // Clear old localStorage keys
            ['dsa_questions', 'dsa_stats', 'dsa_settings', 'dsa_saved_filters', 'dsa_data_version'].forEach(
                (k) => localStorage.removeItem(k)
            );

            await refreshUser();
            setMigrationDone(true);
            toast.success(`Migration complete! ${questions.length} questions synced to the cloud.`);
        } catch (err) {
            console.error(err);
            toast.error('Migration failed', { description: 'Please try again or use Import JSON.' });
        } finally {
            setMigrating(false);
        }
    }

    const hasLocalData = !!localStorage.getItem('dsa_questions');

    return (
        <div className="max-w-2xl space-y-4">
            {/* Appearance */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
                <SettingSection title="Appearance" icon={Palette}>
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            {theme === 'dark' ? (
                                <Moon className="w-4 h-4 text-primary" />
                            ) : (
                                <Sun className="w-4 h-4 text-warning" />
                            )}
                            <div>
                                <Label className="text-sm font-medium">
                                    {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                                </Label>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Theme syncs across all your devices
                                </p>
                            </div>
                        </div>
                        <Switch
                            checked={theme === 'dark'}
                            onCheckedChange={onToggleTheme}
                        />
                    </div>
                </SettingSection>
            </motion.div>

            {/* localStorage Migration — only shown if old data exists */}
            {(hasLocalData || migrationDone) && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                    <SettingSection title="Migrate from Local Storage" icon={ArrowUpFromLine}>
                        {migrationDone ? (
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-success/10 border border-success/20">
                                <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                                <p className="text-sm text-success font-medium">Migration complete! Your data is now synced to the cloud.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
                                    <p className="text-sm font-medium text-warning">Old local data detected</p>
                                    <p className="text-xs text-muted-foreground mt-1 text-pretty">
                                        You have DSA data stored in your browser's localStorage from before the cloud upgrade.
                                        Click below to migrate it to your account.
                                    </p>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleMigrateFromLocalStorage}
                                    disabled={migrating}
                                    className="gap-2 h-9"
                                >
                                    {migrating ? (
                                        <><Loader2 className="w-3.5 h-3.5 animate-spin" />Migrating...</>
                                    ) : (
                                        <><ArrowUpFromLine className="w-3.5 h-3.5" />Migrate to Cloud</>
                                    )}
                                </Button>
                            </div>
                        )}
                    </SettingSection>
                </motion.div>
            )}

            {/* Data Backup */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <SettingSection title="Data Backup" icon={Database}>
                    <div className="flex items-center justify-between gap-4 p-3 bg-muted/30 rounded-lg">
                        <div>
                            <p className="text-sm font-medium text-foreground">Current Data</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {questionCount} question{questionCount !== 1 ? 's' : ''} tracked · Synced to MongoDB Atlas ☁️
                            </p>
                        </div>
                        <div className="w-2 h-2 rounded-full bg-success shrink-0" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <p className="text-xs font-medium text-foreground">Export Data</p>
                            <p className="text-xs text-muted-foreground text-pretty">
                                Download all your questions, settings, and stats as a JSON backup file.
                            </p>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleExport}
                                disabled={questionCount === 0}
                                className="gap-2 h-9"
                            >
                                <Download className="w-3.5 h-3.5" />
                                Export JSON
                            </Button>
                        </div>

                        <div className="space-y-1.5">
                            <p className="text-xs font-medium text-foreground">Import Data</p>
                            <p className="text-xs text-muted-foreground text-pretty">
                                Restore from a previously exported backup file. Replaces current data.
                            </p>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleImportClick}
                                disabled={importing}
                                className="gap-2 h-9"
                            >
                                <Upload className="w-3.5 h-3.5" />
                                {importing ? 'Importing...' : 'Import JSON'}
                            </Button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".json"
                                className="hidden"
                                onChange={handleFileChange}
                            />
                        </div>

                        <div className="space-y-1.5 mt-1">
                            <p className="text-xs font-medium text-foreground">Recalculate Stats</p>
                            <p className="text-xs text-muted-foreground text-pretty">
                                Recomputes active days and revision count from your real history.{' '}
                                <span className="text-warning font-medium">Warning: may override a restored streak.</span>
                            </p>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleRecalculate}
                                disabled={recalculating}
                                className="gap-2 h-9"
                            >
                                <Database className="w-3.5 h-3.5" />
                                {recalculating ? 'Recalculating...' : 'Recalculate Stats'}
                            </Button>
                        </div>
                    </div>
                </SettingSection>
            </motion.div>

            {/* Danger Zone */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <SettingSection title="Danger Zone" icon={Shield}>
                    <div className="p-4 border border-destructive/30 bg-destructive/5 rounded-lg space-y-3">
                        <div>
                            <p className="text-sm font-semibold text-destructive">Reset All Data</p>
                            <p className="text-xs text-muted-foreground mt-1 text-pretty">
                                This will permanently delete all {questionCount} tracked questions, your stats, streaks, and achievements from the cloud. This action cannot be undone.
                            </p>
                        </div>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm" className="gap-2 h-9 border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground">
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Reset All Data
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="max-w-[calc(100%-2rem)] md:max-w-md">
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription className="text-pretty">
                                        This will permanently delete all <strong>{questionCount} questions</strong>, your revision history, streaks, and achievements from the cloud. We strongly recommend exporting your data first.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={handleReset}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                        Yes, Reset Everything
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </SettingSection>
            </motion.div>

            {/* About */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <Card className="border-border/50 shadow-card">
                    <CardContent className="p-5">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shrink-0">
                                <span className="text-lg">⚡</span>
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-foreground">DSA Revision Tracker Pro</p>
                                <p className="text-xs text-muted-foreground mt-0.5 text-pretty">
                                    Never Forget a DSA Problem Again. Built with React, TypeScript, Tailwind CSS, Framer Motion,
                                    Node.js, Express and MongoDB Atlas. Uses spaced repetition to build long-term retention.
                                </p>
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                    {['React', 'TypeScript', 'Tailwind', 'Node.js', 'MongoDB', 'JWT'].map((t) => (
                                        <span key={t} className="px-2 py-0.5 bg-muted text-muted-foreground text-[10px] rounded-full">{t}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
