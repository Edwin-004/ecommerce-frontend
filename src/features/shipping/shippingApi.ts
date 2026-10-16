import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
  CreateZoneGroupRequest,
  DeliveryZoneGroup,
  LocationRegion,
  UpdateZoneRateRequest,
} from '../../types/shipping';

export const shippingApi = createApi({
  reducerPath: 'shippingApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://localhost:8080/api', // /backoffice ရော /locations ပါ ခေါ်နိုင်ရန် /api တွင် အခြေခံထားသည်
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as any).auth?.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['ShippingZone'], // Cache မှတ်ထားရန်နှင့် Auto-refresh လုပ်ရန်
  endpoints: (builder) => ({
    // ၁။ Zone Group အားလုံးနှင့် လက်ရှိဈေးနှုန်းများကို ဆွဲထုတ်ရန် (GET)
    getZoneGroups: builder.query<DeliveryZoneGroup[], void>({
      query: () => '/backoffice/shipping/zones',
      providesTags: ['ShippingZone'],
    }),

    // ၂။ မြန်မာတစ်နိုင်ငံလုံးရှိ တိုင်း/ပြည်နယ် နှင့် မြို့နယ် Master Data ဆွဲထုတ်ရန် (GET)
    getLocations: builder.query<LocationRegion[], void>({
      query: () => '/locations',
    }),

    // ၃။ သက်ဆိုင်ရာ မြို့ (City) အောက်တွင် သတ်မှတ်ပြီးသား မြို့နယ်စာရင်းကို စစ်ဆေးရန် (GET)
    getAssignedTownships: builder.query<string[], string>({
      query: (city) => `/backoffice/shipping/zones/assigned-townships?city=${encodeURIComponent(city)}`,
      providesTags: ['ShippingZone'],
    }),

    // ၄။ Zone အသစ် ဖန်တီးရန် (POST Mutation)
    createZoneGroup: builder.mutation<{ message: string }, CreateZoneGroupRequest>({
      query: (body) => ({
        url: '/backoffice/shipping/zones',
        method: 'POST',
        body,
      }),
      // အောင်မြင်ပါက Table နှင့် Assigned Townships ကို Auto-refresh လုပ်ပေးမည်
      invalidatesTags: ['ShippingZone'],
    }),

    // ၅။ ရှိပြီးသား Zone ၏ ဈေးနှုန်း သို့မဟုတ် Status ပြင်ဆင်ရန် (PUT Mutation)
    updateZoneRate: builder.mutation<{ message: string }, UpdateZoneRateRequest>({
      query: (body) => ({
        url: '/backoffice/shipping/zones/rate',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['ShippingZone'],
    }),
  }),
});

export const {
  useGetZoneGroupsQuery,
  useGetLocationsQuery,
  useGetAssignedTownshipsQuery,
  useCreateZoneGroupMutation,
  useUpdateZoneRateMutation,
} = shippingApi;