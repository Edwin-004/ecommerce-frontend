import { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { type RootState } from '../store';
import {
  getRecentNotifications,
  getUnreadSummary,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  triggerTestRefundNotification,
  type AdminNotificationItem,
} from '../services/notificationApi';

// Web Audio API Synthesizer for pleasant two-tone chime
function playNotificationChime() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // Note 1: 587.33 Hz (D5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.12, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.25);

    // Note 2: 880 Hz (A5)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.12);
    gain2.gain.setValueAtTime(0.18, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.45);
  } catch {
    // Autoplay policy or unsupported audio
  }
}

export function useNotificationSocket() {
  const authRole = useSelector((state: RootState) => state.auth.role);
  const normalizedRole = (authRole || '').toUpperCase();
  // Inventory staff accounts do not use notification features (only Admin and Sales/Order staff have notification access)
  const hasNotificationAccess =
    normalizedRole === 'ADMIN' ||
    normalizedRole === 'ROLE_ADMIN' ||
    normalizedRole === 'SALES_STAFF' ||
    normalizedRole === 'ROLE_SALES_STAFF' ||
    normalizedRole === 'ORDER_STAFF' ||
    normalizedRole === 'ROLE_ORDER_STAFF';
  const [notifications, setNotifications] = useState<AdminNotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [activeToast, setActiveToast] = useState<AdminNotificationItem | null>(null);
  const [showLoginAlert, setShowLoginAlert] = useState<boolean>(false);
  const [loginAlertItems, setLoginAlertItems] = useState<AdminNotificationItem[]>([]);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const connectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef<boolean>(true);

  // Load initial notifications and check unread count for Login Alert
  const loadInitialData = useCallback(async () => {
    if (!hasNotificationAccess) return;
    try {
      const [recentList, unreadSummary] = await Promise.all([
        getRecentNotifications(),
        getUnreadSummary(),
      ]);

      setNotifications(recentList);
      setUnreadCount(unreadSummary.unreadCount);

      // Check if login alert should be displayed (once per session on login)
      const sessionKey = 'admin_login_alert_shown';
      const alreadyShown = sessionStorage.getItem(sessionKey);

      if (!alreadyShown && unreadSummary.unreadCount > 0) {
        setLoginAlertItems(unreadSummary.unreadNotifications);
        setShowLoginAlert(true);
        sessionStorage.setItem(sessionKey, 'true');
      }
    } catch (err) {
      console.warn('Could not load initial notification data:', err);
    }
  }, [hasNotificationAccess]);

  // WebSocket Connection
  useEffect(() => {
    if (!hasNotificationAccess) {
      return;
    }
    isMountedRef.current = true;
    loadInitialData();

    const connectWebSocket = () => {
      // Guard against opening duplicate connections if already connected or connecting
      if (
        socketRef.current &&
        (socketRef.current.readyState === WebSocket.OPEN ||
          socketRef.current.readyState === WebSocket.CONNECTING)
      ) {
        return;
      }

      // Connect to Spring Boot WebSocket endpoint
      const wsUrl = 'ws://localhost:8080/ws/notifications';
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        // If hook unmounted while connecting, close cleanly without error
        if (!isMountedRef.current) {
          try {
            ws.close(1000, 'Unmounted');
          } catch {
            // Suppress close error during teardown
          }
          return;
        }

        console.log('✅ Connected to Admin Notification WebSocket');
        // Heartbeat ping every 25 seconds
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send('ping');
          }
        }, 25000);
      };

      ws.onmessage = (event) => {
        if (!isMountedRef.current) return;
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'NOTIFICATION' && data.data) {
            const newNotif = data.data as AdminNotificationItem;

            // Play notification sound
            playNotificationChime();

            // Update notifications list and unread count
            setNotifications((prev) => [newNotif, ...prev.filter((n) => n.notificationId !== newNotif.notificationId)]);
            if (typeof data.unreadCount === 'number') {
              setUnreadCount(data.unreadCount);
            } else {
              setUnreadCount((c) => c + 1);
            }

            // Show interactive real-time toast
            setActiveToast(newNotif);
          }
        } catch {
          // Non-JSON or keep-alive message
        }
      };

      ws.onclose = (event) => {
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
        // Only reconnect if still mounted and was not an intentional clean close (code 1000)
        if (isMountedRef.current && event.code !== 1000) {
          // Reconnect with 3 second delay
          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket();
          }, 3000);
        }
      };

      ws.onerror = (err) => {
        // Suppress false-positive error logs when unmounting or intentionally cleaning up
        if (!isMountedRef.current) return;
        console.warn('Notification WebSocket error:', err);
        ws.close();
      };
    };

    // Debounce initial connection by 80ms to guard against React 18 StrictMode immediate unmount/remount
    connectTimerRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        connectWebSocket();
      }
    }, 80);

    return () => {
      isMountedRef.current = false;
      if (connectTimerRef.current) clearTimeout(connectTimerRef.current);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);

      const ws = socketRef.current;
      if (ws) {
        // Detach listeners to prevent state updates after unmount
        ws.onmessage = null;
        if (ws.readyState === WebSocket.CONNECTING) {
          // Guard against premature close error: close cleanly once connection opens
          ws.onopen = () => {
            try {
              ws.close(1000, 'Unmounted');
            } catch {
              // Teardown ignore
            }
          };
          ws.onerror = null;
          ws.onclose = null;
        } else if (ws.readyState === WebSocket.OPEN) {
          ws.onopen = null;
          ws.onerror = null;
          ws.onclose = null;
          try {
            ws.close(1000, 'Unmounted');
          } catch {
            // Teardown ignore
          }
        }
        socketRef.current = null;
      }
    };
  }, [loadInitialData, hasNotificationAccess]);

  // Auto-dismiss active toast after 8 seconds
  useEffect(() => {
    if (activeToast) {
      const timer = setTimeout(() => {
        setActiveToast(null);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [activeToast]);

  const handleMarkAsRead = async (id: number) => {
    try {
      await markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.notificationId === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const dismissToast = () => {
    setActiveToast(null);
  };

  const dismissLoginAlert = () => {
    setShowLoginAlert(false);
  };

  const triggerTestRefund = async () => {
    try {
      await triggerTestRefundNotification();
    } catch (err) {
      console.error('Test notification trigger failed:', err);
    }
  };

  return {
    notifications,
    unreadCount,
    activeToast,
    dismissToast,
    showLoginAlert,
    loginAlertItems,
    dismissLoginAlert,
    markAsRead: handleMarkAsRead,
    markAllAsRead: handleMarkAllAsRead,
    triggerTestRefund,
    hasNotificationAccess,
  };
}
