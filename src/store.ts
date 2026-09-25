import { configureStore } from '@reduxjs/toolkit';
import authReducer from './features/auth/authSlice';
import { orderApi } from './features/orders/orderApi';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [orderApi.reducerPath]: orderApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(orderApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;