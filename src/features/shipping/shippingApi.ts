import { createApi } from '@reduxjs/toolkit/query/react';
import { createAxiosBaseQuery, rootApi } from '../../utils/axiosConfig';
import type {
  CreateZoneGroupRequest,
  LocationRegion,
  UpdateZoneRateRequest,
} from '../../types/shipping';
import type { PaginatedResponse } from '../../types/PaginatedResponse';

export const shippingApi = createApi({
  reducerPath: 'shippingApi',
  baseQuery: createAxiosBaseQuery(rootApi),
  tagTypes: ['ShippingZone'],
  endpoints: (builder) => ({
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

    getLocations: builder.query<LocationRegion[], void>({
      query: () => '/locations',
    }),

    getCitiesByRegion: builder.query<string[], string>({
      query: (region) => `/locations/cities?region=${encodeURIComponent(region)}`,
    }),

    getTownshipsByCity: builder.query<string[], string>({
      query: (city) => `/locations/townships?city=${encodeURIComponent(city)}`,
    }),

    getAssignedTownships: builder.query<string[], string>({
      query: (city) => `/backoffice/shipping/zones/assigned-townships?city=${encodeURIComponent(city)}`,
      providesTags: ['ShippingZone'],
    }),

    createZoneGroup: builder.mutation<{ message: string }, CreateZoneGroupRequest>({
      query: (body) => ({
        url: '/backoffice/shipping/zones',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['ShippingZone'],
    }),

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
      providesTags: ['ShippingZone'],
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
