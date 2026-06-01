import type { ReactNode } from 'react';

export interface RouteConfig {
    name: string;
    path: string;
    element: ReactNode;
    visible?: boolean;
    public?: boolean;
}

// Routes are managed directly in App.tsx for this application.
export const routes: RouteConfig[] = [];
