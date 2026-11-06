// src/utils/axiosConfig.ts
import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosError } from 'axios';
import type { BaseQueryFn } from '@reduxjs/toolkit/query';
import { store } from '../store';
import { logout } from '../features/auth/authSlice';

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8004';

// Attach authorization header interceptor
const attachAuthInterceptor = (instance: AxiosInstance) => {
  instance.interceptors.request.use(
    (config) => {
      const state: any = store.getState();
      const token = state.auth?.token || localStorage.getItem('token');
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );
};

// Handle 401 unauthorized / session termination
const handleAuthError = (error: any) => {
  if (error.response && error.response.status === 401) {
    const errorData = error.response.data;
    let message = 'Your session has expired. Please log in again.';

    if (
      errorData?.error === 'SESSION_TERMINATED' ||
      (errorData?.message && errorData.message.includes('another session'))
    ) {
      message =
        'Your session has expired because a new login occurred from another device or browser tab.';
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

// Backoffice API instance (Base URL: /api/backoffice)
export const api: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api/backoffice`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Root API instance (Base URL: /api) for non-backoffice endpoints (e.g. /v1/admin, /locations)
export const rootApi: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Configure interceptors
attachAuthInterceptor(api);
attachAuthInterceptor(rootApi);

api.interceptors.response.use((response) => response, handleAuthError);
rootApi.interceptors.response.use((response) => response, handleAuthError);
axios.interceptors.response.use((response) => response, handleAuthError);

// Redux Toolkit Query BaseQuery adapter using Axios instances
export interface AxiosBaseQueryParams {
  url: string;
  method?: AxiosRequestConfig['method'];
  data?: AxiosRequestConfig['data'];
  body?: AxiosRequestConfig['data'];
  params?: AxiosRequestConfig['params'];
  headers?: AxiosRequestConfig['headers'];
  responseType?: AxiosRequestConfig['responseType'];
}

export const createAxiosBaseQuery = (
  client: AxiosInstance = api
): BaseQueryFn<string | AxiosBaseQueryParams, unknown, unknown> => {
  return async (args) => {
    try {
      const config: AxiosRequestConfig =
        typeof args === 'string'
          ? { url: args, method: 'GET' }
          : {
              url: args.url,
              method: args.method || 'GET',
              data: args.data !== undefined ? args.data : args.body,
              params: args.params,
              headers: args.headers,
              responseType: args.responseType,
            };

      const result = await client(config);
      return { data: result.data };
    } catch (axiosError) {
      const err = axiosError as AxiosError;
      return {
        error: {
          status: err.response?.status,
          data: err.response?.data || err.message,
        },
      };
    }
  };
};

export default api;
