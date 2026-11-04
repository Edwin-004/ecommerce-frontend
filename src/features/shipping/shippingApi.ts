import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
  CreateZoneGroupRequest,
  LocationRegion,
  UpdateZoneRateRequest,
} from '../../types/shipping';
import type { PaginatedResponse } from '../../types/PaginatedResponse';

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
   getZoneGroups: builder.query<
      PaginatedResponse<any>,
      { search?: string; status?: string; page?: number; size?: number } | void
    >({
      query: (args) => {
        const page = args?.page ?? 0;
        const size = args?.size ?? 10;
        let url = `/backoffice/shipping/zones?page=${page}&size=${size}`;
        
        if (args?.search) url += `&search=${args.search}`;
        if (args?.status && args.status !== 'ALL') url += `&status=${args.status}`;
        
        return url;
      },
      providesTags: ['ShippingZone'],
    }),

    toggleZoneStatus: builder.mutation<void, { zoneName: string; city: string; newStatus: string }>({
      query: ({ zoneName, city, newStatus }) => ({
        url: `/backoffice/shipping/zones/${encodeURIComponent(zoneName)}/status?city=${encodeURIComponent(city)}&newStatus=${newStatus}`,
        method: 'PATCH',
      }),
      invalidatesTags: ['ShippingZone'],
    }),

    // ၂။ မြန်မာတစ်နိုင်ငံလုံးရှိ တိုင်း/ပြည်နယ် နှင့် မြို့နယ် Master Data ဆွဲထုတ်ရန် (GET)
    getLocations: builder.query<LocationRegion[], void>({
      query: () => '/locations',
    }),

    getCitiesByRegion: builder.query<string[], string>({
      query: (region) => `/locations/cities?region=${encodeURIComponent(region)}`,
    }),

    getTownshipsByCity: builder.query<string[], string>({
      query: (city) => `/locations/townships?city=${encodeURIComponent(city)}`,
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

    getZoneStats: builder.query<{ total: number; active: number; inactive: number }, void>({
      query: () => '/backoffice/shipping/zones/stats',
      providesTags: ['ShippingZone'], // Create, Edit, Toggle လုပ်တိုင်း Auto Refresh ဖြစ်စေရန်
    }),

  }),
});

export const {
  useGetZoneGroupsQuery,
  useGetLocationsQuery,
  useGetAssignedTownshipsQuery,
  useCreateZoneGroupMutation,
  useUpdateZoneRateMutation,
  useToggleZoneStatusMutation,
  useGetCitiesByRegionQuery,
  useGetTownshipsByCityQuery,
  useGetZoneStatsQuery,
} = shippingApi;