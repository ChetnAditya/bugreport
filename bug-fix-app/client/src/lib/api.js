import axios from 'axios';
export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true,
    headers: { 'X-Requested-With': 'fetch' },
});
api.interceptors.response.use((r) => r, (err) => Promise.reject(err));
