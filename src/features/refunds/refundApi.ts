import { apiFetch } from '../../utils/api';

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
  const query = new URLSearchParams();
  if (params.search?.trim()) query.append('search', params.search.trim());
  if (params.status && params.status !== 'ALL') query.append('status', params.status);
  if (params.startDate) query.append('startDate', params.startDate);
  if (params.endDate) query.append('endDate', params.endDate);

  const qs = query.toString() ? `?${query.toString()}` : '';
  return apiFetch<RefundRequestItem[]>(`/api/v1/admin/refunds${qs}`);
}

export async function getRefundStats(): Promise<RefundStats> {
  return apiFetch<RefundStats>('/api/v1/admin/refunds/stats');
}

export async function approveRefund(
  refundId: number,
  adminNote?: string
): Promise<RefundRequestItem> {
  return apiFetch<RefundRequestItem>(`/api/v1/admin/refunds/${refundId}/approve`, {
    method: 'PUT',
    body: JSON.stringify({ adminNote: adminNote || '' }),
  });
}

export async function rejectRefund(
  refundId: number,
  adminNote: string
): Promise<RefundRequestItem> {
  return apiFetch<RefundRequestItem>(`/api/v1/admin/refunds/${refundId}/reject`, {
    method: 'PUT',
    body: JSON.stringify({ adminNote }),
  });
}

export async function seedMockRefundData(): Promise<{ message: string; totalRequests: number }> {
  return apiFetch<{ message: string; totalRequests: number }>('/api/v1/admin/refunds/seed-mock', {
    method: 'POST',
  });
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
  const token = localStorage.getItem('token');
  const query = new URLSearchParams();
  if (params.search?.trim()) query.append('search', params.search.trim());
  if (params.status && params.status !== 'ALL') query.append('status', params.status);
  if (params.startDate) query.append('startDate', params.startDate);
  if (params.endDate) query.append('endDate', params.endDate);
  if (params.columns?.length) query.append('columns', params.columns.join(','));

  const url = `http://localhost:8080/api/v1/reports/refunds/export/${format}?${query.toString()}`;
  const response = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Export failed');
    throw new Error(errorText || `Export failed with status ${response.status}`);
  }
  return response.blob();
}
