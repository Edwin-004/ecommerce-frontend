// src/utils/axiosConfig.ts
import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8080/api/v1',
});

// Request မပို့ခင် Token ကို အလိုအလျောက် ထည့်ပေးမည့် စနစ်
api.interceptors.request.use(
    (config) => {
        // Login ဝင်စဉ်က သိမ်းထားသော Token ကို ယူပါ (သင့် Project ၏ သိမ်းဆည်းပုံအရ ပြင်ဆင်ပါ)
        const token = localStorage.getItem('token'); 
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;