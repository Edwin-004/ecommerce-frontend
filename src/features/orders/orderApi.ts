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

    getPaymentByOrderNo: builder.query({
      query: (orderNo) => `/orders/${orderNo}/payment-info`,
    }),

    // ၁။ Courier List ဆွဲယူရန် (GET Query)
    getCouriers: builder.query<string[], void>({
      // သင့် Backend တွင် @GetMapping("/couriers") ဟု သီးသန့်ရေးထားပါက /couriers ကိုသုံးပါ။
      // OrderManagementController ၏ @RequestMapping အောက်တွင် ရေးထားပါက /orders/couriers ဟုသုံးပါ။
      query: () => 'orders/couriers', 
    }),

    // ၂။ Shipment ဖန်တီးရန်နှင့် Status SHIPPED သို့ ပြောင်းရန် (POST Mutation)
    createShipment: builder.mutation<void, { orderNo: string; courierName: string; trackingNumber: string }>({
      query: ({ orderNo, ...body }) => ({
        url: `/orders/${orderNo}/shipments`,
        method: 'POST',
        body, 
      }),
      // API အောင်မြင်ပါက All Orders List နှင့် လက်ရှိ Order Detail ကို Auto-refresh လုပ်ပေးမည်
      invalidatesTags: (_result, _error, { orderNo }) => ['Order', { type: 'Order', id: orderNo }],
    }),

    // ၃။ အခြား Status များကို ရိုးရိုး ပြောင်းရန် (PATCH Mutation)
    updateOrderStatus: builder.mutation<void, { orderNo: string; newStatus: string }>({
      query: ({ orderNo, newStatus }) => ({
        url: `/orders/${orderNo}/status`,
        method: 'PATCH',
        body: { newStatus },
      }),
      // API အောင်မြင်ပါက Auto-refresh လုပ်ပေးမည်
      invalidatesTags: (_result, _error, { orderNo }) => ['Order', { type: 'Order', id: orderNo }],
    }),
    
  }),
});

// React Component များတွင် အလွယ်တကူ သုံးနိုင်ရန် Hook အဖြစ် ထုတ်ပေးခြင်း
export const { 
  useGetOrdersQuery, 
  useGetOrderByOrderNoQuery, 
  useGetPaymentByOrderNoQuery,
  useGetCouriersQuery,
  useCreateShipmentMutation,
  useUpdateOrderStatusMutation} = orderApi;