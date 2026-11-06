import { createApi } from '@reduxjs/toolkit/query/react';
import { createAxiosBaseQuery, api } from '../../utils/axiosConfig';
import type { OrderResponseDto } from '../../types/order';
import type { PaginatedResponse } from '../../types/PaginatedResponse';

export const orderApi = createApi({
  reducerPath: 'orderApi',
  baseQuery: createAxiosBaseQuery(api),
  tagTypes: ['Order'],
  endpoints: (builder) => ({
    getOrders: builder.query<
      PaginatedResponse<OrderResponseDto>,
      { status?: string; search?: string; startDate?: string; endDate?: string; page?: number; size?: number } | void
    >({
      query: (args) => {
        const page = args?.page ?? 0;
        const size = args?.size ?? 10;
        let url = `/orders?page=${page}&size=${size}`;
        if (args?.status && args.status !== 'ALL') {
          url += `&status=${args.status}`;
        }
        if (args?.search) {
          url += `&search=${args.search}`;
        }
        if (args?.startDate) {
          url += `&startDate=${args.startDate}`;
        }
        if (args?.endDate) {
          url += `&endDate=${args.endDate}`;
        }
        return url;
      },
      providesTags: ['Order'],
    }),

    getOrderByOrderNo: builder.query<OrderResponseDto, string>({
      query: (orderNo) => `/orders/${orderNo}`,
      providesTags: (_result, _error, orderNo) => [{ type: 'Order', id: orderNo }],
    }),

    getPaymentByOrderNo: builder.query({
      query: (orderNo) => `/orders/${orderNo}/payment-info`,
    }),

    getCouriers: builder.query<string[], void>({
      query: () => '/orders/couriers',
    }),

    createShipment: builder.mutation<void, { orderNo: string; courierName: string; trackingNumber: string }>({
      query: ({ orderNo, ...body }) => ({
        url: `/orders/${orderNo}/shipments`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _error, { orderNo }) => ['Order', { type: 'Order', id: orderNo }],
    }),

    updateOrderStatus: builder.mutation<void, { orderNo: string; newStatus: string }>({
      query: ({ orderNo, newStatus }) => ({
        url: `/orders/${orderNo}/status`,
        method: 'PATCH',
        body: { newStatus },
      }),
      invalidatesTags: (_result, _error, { orderNo }) => ['Order', { type: 'Order', id: orderNo }],
    }),

    getOrderStatusHistory: builder.query<any[], string>({
      query: (orderNo) => `/orders/${orderNo}/history`,
      providesTags: ['Order'],
    }),
  }),
});

export const {
  useGetOrdersQuery,
  useGetOrderByOrderNoQuery,
  useGetPaymentByOrderNoQuery,
  useGetCouriersQuery,
  useCreateShipmentMutation,
  useUpdateOrderStatusMutation,
  useGetOrderStatusHistoryQuery,
} = orderApi;
