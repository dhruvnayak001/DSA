import { useEffect, useRef, useState } from 'react';

export function useAnimatedCounter(target: number, duration = 800) {
    const [value, setValue] = useState(0);
    const rafRef = useRef<number | null>(null);

    useEffect(() => {
        const start = performance.now();
        const from = 0;

        const animate = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(Math.round(from + (target - from) * eased));
            if (progress < 1) {
                rafRef.current = requestAnimationFrame(animate);
            }
        };

        rafRef.current = requestAnimationFrame(animate);
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [target, duration]);

    return value;
}
