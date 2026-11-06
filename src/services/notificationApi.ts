import { rootApi } from '../utils/axiosConfig';

export interface AdminNotificationItem {
  notificationId: number;
  type: string;
  title: string;
  message: string;
  link?: string;
  referenceId?: number;
  isRead: boolean;
  createdAt: string;
  orderNo?: string;
  customerName?: string;
  amount?: number;
  reason?: string;
}

export interface UnreadSummaryResponse {
  unreadCount: number;
  unreadNotifications: AdminNotificationItem[];
}

export async function getRecentNotifications(): Promise<AdminNotificationItem[]> {
  const response = await rootApi.get<AdminNotificationItem[]>('/v1/admin/notifications');
  return response.data;
}

export async function getUnreadSummary(): Promise<UnreadSummaryResponse> {
  const response = await rootApi.get<UnreadSummaryResponse>('/v1/admin/notifications/unread-count');
  return response.data;
}

export async function markNotificationAsRead(notificationId: number): Promise<void> {
  await rootApi.put<void>(`/v1/admin/notifications/${notificationId}/read`);
}

export async function markAllNotificationsAsRead(): Promise<void> {
  await rootApi.put<void>('/v1/admin/notifications/read-all');
}

export async function triggerTestRefundNotification(): Promise<AdminNotificationItem> {
  const response = await rootApi.post<AdminNotificationItem>('/v1/admin/notifications/test-refund');
  return response.data;
}
