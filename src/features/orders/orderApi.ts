import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { OrderResponseDto } from '../../types/order';

export const orderApi = createApi({
  reducerPath: 'orderApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://localhost:8080/api/backoffice',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as any).auth?.token; 
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Order'], // Cache မှတ်ထားရန်
  endpoints: (builder) => ({
    // အော်ဒါအားလုံး (သို့) Status အလိုက် ဆွဲထုတ်မည့် API
    getOrders: builder.query<OrderResponseDto[], string | void>({
      query: (status) => status ? `/orders?status=${status}` : '/orders',
      providesTags: ['Order'],
    }),

    getOrderByOrderNo: builder.query<OrderResponseDto, string>({
      query: (orderNo) => `/orders/${orderNo}`,
      // ID အလိုက် Cache မှတ်ထားမှ Update လုပ်တဲ့အခါ ဒီတစ်ခုတည်းကိုပဲ Refresh ပြန်လုပ်လို့ရပါမည်
      providesTags: (_result, _error, orderNo) => [{ type: 'Order', id: orderNo }], 
    }),

  }),
});

// React Component များတွင် အလွယ်တကူ သုံးနိုင်ရန် Hook အဖြစ် ထုတ်ပေးခြင်း
export const { useGetOrdersQuery, useGetOrderByOrderNoQuery } = orderApi;