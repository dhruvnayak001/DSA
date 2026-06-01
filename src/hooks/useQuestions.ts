import { useState, useCallback, useEffect, useRef } from 'react';
import type { DSAQuestion, QuestionFormData, UserStats } from '@/types/types';
import { questionsApi } from '@/api/questions';
import { todayISO } from '@/utils/helpers';
import { toast } from 'sonner';

export function useQuestions() {
    const [questions, setQuestions] = useState<DSAQuestion[]>([]);
    const [loading, setLoading] = useState(true);
    // Callback ref to avoid stale closures when stats refresh is needed
    const onStatsUpdate = useRef<((stats: UserStats) => void) | null>(null);

    const refresh = useCallback(async () => {
        try {
            const qs = await questionsApi.getAll();
            setQuestions(qs);
        } catch {
            // Silent — auth interceptor handles 401
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const addQuestion = useCallback(async (data: QuestionFormData): Promise<boolean> => {
        try {
            const newQ = await questionsApi.add(data);
            setQuestions((prev) => [newQ, ...prev]);
            toast.success('Question added!', { description: `"${newQ.name}" has been tracked.` });
            return true;
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })
                ?.response?.data?.message ?? 'Failed to add question';
            toast.error(msg);
            return false;
        }
    }, []);

    const updateQuestion = useCallback(async (updated: DSAQuestion): Promise<void> => {
        try {
            const result = await questionsApi.update(updated);
            setQuestions((prev) => prev.map((q) => (q.id === result.id ? result : q)));
            toast.success('Question updated!');
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })
                ?.response?.data?.message ?? 'Failed to update question';
            toast.error(msg);
        }
    }, []);

    const deleteQuestion = useCallback(async (id: string, name: string): Promise<void> => {
        try {
            await questionsApi.delete(id);
            setQuestions((prev) => prev.filter((q) => q.id !== id));
            toast.success('Question deleted', { description: `"${name}" has been removed.` });
        } catch {
            toast.error('Failed to delete question');
        }
    }, []);

    const duplicateQuestion = useCallback(async (id: string): Promise<void> => {
        try {
            const copy = await questionsApi.duplicate(id);
            setQuestions((prev) => [copy, ...prev]);
            toast.success('Question duplicated!');
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })
                ?.response?.data?.message ?? 'Failed to duplicate question';
            toast.error(msg);
        }
    }, []);

    const markRevised = useCallback(async (id: string, confidence?: number): Promise<UserStats | null> => {
        try {
            // Default to current confidence if not provided
            const currentQ = questions.find((q) => q.id === id);
            const conf = confidence ?? currentQ?.confidence ?? 3;
            const { question, stats } = await questionsApi.revise(id, conf);
            setQuestions((prev) => prev.map((q) => (q.id === question.id ? question : q)));
            toast.success('Marked as revised! 🎉', { description: 'Next revision date updated.' });
            return stats;
        } catch {
            toast.error('Failed to mark as revised');
            return null;
        }
    }, [questions]);

    const importQuestions = useCallback(async (qs: DSAQuestion[]): Promise<void> => {
        try {
            const result = await questionsApi.importQuestions(qs);
            setQuestions(result.questions);
        } catch {
            toast.error('Failed to import questions');
        }
    }, []);

    const resetAll = useCallback(async (): Promise<void> => {
        try {
            await questionsApi.importQuestions([]);
            setQuestions([]);
        } catch {
            toast.error('Failed to reset questions');
        }
    }, []);

    const todayStr = todayISO();
    const dueToday = questions.filter((q) => {
        const next = new Date(q.nextRevision);
        const today = new Date(todayStr);
        return next <= today;
    });

    return {
        questions,
        dueToday,
        loading,
        addQuestion,
        updateQuestion,
        deleteQuestion,
        duplicateQuestion,
        markRevised,
        importQuestions,
        resetAll,
        refresh,
        onStatsUpdate,
    };
}
