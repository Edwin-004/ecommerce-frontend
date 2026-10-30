import { apiFetch } from '../utils/api';

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
  return apiFetch<AdminNotificationItem[]>('/api/v1/admin/notifications');
}

export async function getUnreadSummary(): Promise<UnreadSummaryResponse> {
  return apiFetch<UnreadSummaryResponse>('/api/v1/admin/notifications/unread-count');
}

export async function markNotificationAsRead(notificationId: number): Promise<void> {
  await apiFetch<void>(`/api/v1/admin/notifications/${notificationId}/read`, {
    method: 'PUT',
  });
}

export async function markAllNotificationsAsRead(): Promise<void> {
  await apiFetch<void>('/api/v1/admin/notifications/read-all', {
    method: 'PUT',
  });
}

export async function triggerTestRefundNotification(): Promise<AdminNotificationItem> {
  return apiFetch<AdminNotificationItem>('/api/v1/admin/notifications/test-refund', {
    method: 'POST',
  });
}
