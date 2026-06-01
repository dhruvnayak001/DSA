import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const TOKEN_KEY = 'dsa_jwt_token';

export const apiClient = axios.create({
    baseURL: BASE_URL,
    headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor: attach JWT ───────────────────────────────────────────
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// ── Response interceptor: handle 401 ─────────────────────────────────────────
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid — clear auth state
            localStorage.removeItem(TOKEN_KEY);
            // Reload to trigger auth redirect
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export { TOKEN_KEY };
