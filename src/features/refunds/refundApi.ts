import api, { rootApi } from '../../utils/axiosConfig';

export type RefundStatusFilter = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED';

export interface RefundRequestItem {
  refundId: number;
  orderItemId?: number;
  orderId?: number;
  orderNo?: string;
  customerName?: string;
  customerEmail?: string;
  productName?: string;
  refundQuantity?: number;
  refundAmount?: number;
  reason?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestedAt: string;
  processedAt?: string | null;
  processedByName?: string | null;
  adminNote?: string | null;
}

export interface RefundStats {
  totalRequests: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  totalRefundedAmount: number;
}

export async function getRefunds(params: {
  search?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}): Promise<RefundRequestItem[]> {
  const queryParams: Record<string, any> = {};
  if (params.search?.trim()) queryParams['search'] = params.search.trim();
  if (params.status && params.status !== 'ALL') queryParams['status'] = params.status;
  if (params.startDate) queryParams['startDate'] = params.startDate;
  if (params.endDate) queryParams['endDate'] = params.endDate;

  const response = await rootApi.get<RefundRequestItem[]>('/v1/admin/refunds', {
    params: queryParams,
  });
  return response.data;
}

export async function getRefundStats(): Promise<RefundStats> {
  const response = await rootApi.get<RefundStats>('/v1/admin/refunds/stats');
  return response.data;
}

export async function approveRefund(
  refundId: number,
  adminNote?: string
): Promise<RefundRequestItem> {
  const response = await rootApi.put<RefundRequestItem>(`/v1/admin/refunds/${refundId}/approve`, {
    adminNote: adminNote || '',
  });
  return response.data;
}

export async function rejectRefund(
  refundId: number,
  adminNote: string
): Promise<RefundRequestItem> {
  const response = await rootApi.put<RefundRequestItem>(`/v1/admin/refunds/${refundId}/reject`, {
    adminNote,
  });
  return response.data;
}

export async function exportRefundReport(
  format: 'pdf' | 'excel',
  params: {
    search?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    columns: string[];
  }
): Promise<Blob> {
  if (params.search && params.search.trim().length > 100) {
    throw new Error('Search query cannot exceed 100 characters.');
  }
  if (params.startDate && params.endDate) {
    const diffDays = (new Date(params.endDate).getTime() - new Date(params.startDate).getTime()) / (1000 * 3600 * 24);
    if (diffDays > 365) {
      throw new Error('Date range cannot exceed 1 year (365 days) for report generation.');
    }
  }

  const queryParams: Record<string, any> = {};
  if (params.search?.trim()) queryParams['search'] = params.search.trim();
  if (params.status && params.status !== 'ALL') queryParams['status'] = params.status;
  if (params.startDate) queryParams['startDate'] = params.startDate;
  if (params.endDate) queryParams['endDate'] = params.endDate;
  if (params.columns?.length) queryParams['columns'] = params.columns.join(',');

  const response = await api.get(`/reports/refunds/export/${format}`, {
    params: queryParams,
    responseType: 'blob',
  });

  return response.data as Blob;
}
