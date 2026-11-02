// src/utils/axiosConfig.ts
import axios from 'axios';
import { store } from '../store';
import { logout } from '../features/auth/authSlice';

const api = axios.create({
    baseURL: 'http://localhost:8080/api/backoffice',
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    (config) => {
        // Redux ထဲမှဖြစ်စေ၊ localStorage ထဲမှဖြစ်စေ Token ကို သေချာပေါက် ဆွဲထုတ်ပါမည်
        const state: any = store.getState();
        const token = state.auth?.token || localStorage.getItem('token'); 

        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

const handleAuthError = (error: any) => {
    if (error.response && error.response.status === 401) {
        store.dispatch(logout());
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        localStorage.removeItem('email');
        localStorage.removeItem('role');
        localStorage.removeItem('permissions');

        if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
        }
    }
    return Promise.reject(error);
};

api.interceptors.response.use((response) => response, handleAuthError);
axios.interceptors.response.use((response) => response, handleAuthError);

export default api;
