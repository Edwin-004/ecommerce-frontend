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
        const errorData = error.response.data;
        let message = 'Your session has expired. Please log in again.';

        if (errorData?.error === 'SESSION_TERMINATED' || (errorData?.message && errorData.message.includes('another session'))) {
            message = '⚠️ သင့်အကောင့်အား အခြားနေရာ (Device သို့မဟုတ် Tab) မှ Login ဝင်ရောက်သွားပါသဖြင့် ဤ Session ကို အလိုအလျောက် ပိတ်လိုက်ပါသည် (Your session expired because of a new login from another session).';
        } else if (errorData?.message) {
            message = errorData.message;
        }

        sessionStorage.setItem('auth_expired_message', message);

        store.dispatch(logout());
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        localStorage.removeItem('email');
        localStorage.removeItem('role');
        localStorage.removeItem('permissions');

        if (!window.location.pathname.includes('/login')) {
            const currentPath = window.location.pathname + window.location.search;
            window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
        }
    }
    return Promise.reject(error);
};

api.interceptors.response.use((response) => response, handleAuthError);
axios.interceptors.response.use((response) => response, handleAuthError);

export default api;
