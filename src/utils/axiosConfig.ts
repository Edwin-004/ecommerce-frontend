// src/utils/axiosConfig.ts
import axios from 'axios';
import { store } from '../store';

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

        // Console တွင် Token ပါ/မပါ စမ်းသပ်ကြည့်နိုင်ရန် (နောက်မှ ပြန်ဖျက်နိုင်ပါသည်)
        console.log("Axios Interceptor - Token is:", token ? "Attached ✅" : "Missing ❌");

        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;