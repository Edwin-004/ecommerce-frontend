import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import axiosInstance from '../../utils/axiosConfig';
import type { AuditLog } from '../../types/auditLog';

interface AuditLogState {
  logs: AuditLog[];
  loading: boolean;
  error: string | null;
}

const initialState: AuditLogState = {
  logs: [],
  loading: false,
  error: null,
};

// Date Filter အတွက် Parameter Data Type ကို ကြေညာခြင်း
interface FetchAuditLogsArgs {
  startDate?: string;
  endDate?: string;
}

// args ကို လက်ခံပြီး API ကိုလှမ်းခေါ်မည့်အပိုင်း
export const fetchAuditLogs = createAsyncThunk(
  'auditLog/fetchAuditLogs',
  async (args: FetchAuditLogsArgs | undefined, { rejectWithValue }) => {
    try {
      let url = '/audit-logs';
      
      const params = new URLSearchParams();
      if (args?.startDate && args.startDate.trim()) {
        params.append('startDate', args.startDate.trim());
      }
      if (args?.endDate && args.endDate.trim()) {
        params.append('endDate', args.endDate.trim());
      }
      const qs = params.toString();
      if (qs) {
        url += `?${qs}`;
      }

      const response = await axiosInstance.get<AuditLog[]>(url);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch audit logs');
    }
  }
);

const auditLogSlice = createSlice({
  name: 'auditLog',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAuditLogs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAuditLogs.fulfilled, (state, action: PayloadAction<AuditLog[]>) => {
        state.loading = false;
        state.logs = action.payload;
      })
      .addCase(fetchAuditLogs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default auditLogSlice.reducer;
