import { useState, useRef, useEffect } from "react";
import {
  FiBell,
  FiMenu,
  FiRefreshCcw,
  FiCheck,
  FiZap,
  
  FiHome,
} from "react-icons/fi";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { type RootState } from "../store";
import styles from "./Topbar.module.css";
import { useNotificationSocket } from "../hooks/useNotificationSocket";
import { NotificationToast } from "./notifications/NotificationToast";
import { LoginUnreadModal } from "./notifications/LoginUnreadModal";
import { type AdminNotificationItem } from "../services/notificationApi";

interface TopbarProps {
  onToggleMobileMenu?: () => void;
  isMobileMenuOpen?: boolean;
}

export const Topbar = ({ onToggleMobileMenu }: TopbarProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Redux auth state
  const { username, role } = useSelector((state: RootState) => state.auth);

  // Notifications via WebSocket Hook
  const {
    notifications,
    unreadCount,
    activeToast,
    dismissToast,
    showLoginAlert,
    loginAlertItems,
    dismissLoginAlert,
    markAsRead,
    markAllAsRead,
    triggerTestRefund,
  } = useNotificationSocket();

  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    if (showDropdown) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [showDropdown]);

  // Role formatter
  const formatRole = (roleStr: string | null) => {
    if (roleStr === "BUSINESS_OWNER" || roleStr === "OWNER") return "Business Owner";
    if (roleStr === "ADMIN") return "System Admin";
    if (roleStr === "INVENTORY_STAFF") return "Inventory Staff";
    if (roleStr === "SALES_STAFF") return "Sales Staff";
    return roleStr || "Staff";
  };

  const firstLetter = username ? username.charAt(0).toUpperCase() : 'A';

  const handleNotificationItemClick = (item: AdminNotificationItem) => {
    if (!item.isRead) {
      markAsRead(item.notificationId);
    }
    setShowDropdown(false);
    navigate(item.link || "/admin/refunds");
  };

  const formatTimeAgo = (isoDate?: string) => {
    if (!isoDate) return "Just now";
    try {
      const diff = Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000);
      if (diff < 60) return "Just now";
      if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
      if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
      return `${Math.floor(diff / 86400)}d ago`;
    } catch {
      return "Recently";
    }
  };

  const getBreadcrumbTitle = (path: string): string => {
    if (path.startsWith('/admin/dashboard')) return 'Overview';
    if (path.startsWith('/admin/products/new')) return 'Create Product';
    if (path.startsWith('/admin/products')) return 'Product List';
    if (path.startsWith('/admin/categories')) return 'Categories';
    if (path.startsWith('/admin/brands')) return 'Brands';
    if (path.startsWith('/admin/tags')) return 'Tags';
    if (path.startsWith('/admin/variants')) return 'Variants & Options';
    if (path.startsWith('/admin/inventory')) return 'Inventory & Stock';
    if (path.startsWith('/admin/orders')) return 'All Orders';
    if (path.startsWith('/admin/refunds')) return 'Refund Management';
    if (path.startsWith('/admin/shipping-rates')) return 'Shipping Rates';
    if (path.startsWith('/admin/staff/new')) return 'Add Staff';
    if (path.startsWith('/admin/staff')) return 'Staff Management';
    if (path.startsWith('/admin/reports')) return 'Reports & Analytics';
    if (path.startsWith('/admin/profile')) return 'My Profile';
    return 'Dashboard';
  };

  const isDashboard = location.pathname === '/admin/dashboard';

  return (
    <>
      {/* 1. Real-time Toast Notification (Pop-up upon new refund event) */}
      {activeToast && (
        <NotificationToast
          notification={activeToast}
          onClose={dismissToast}
          onRead={markAsRead}
        />
      )}

      {/* 2. Login Unread Notifications Alert Dialog (Appears upon login if unread requests exist) */}
      {showLoginAlert && (
        <LoginUnreadModal
          unreadCount={unreadCount}
          items={loginAlertItems}
          onClose={dismissLoginAlert}
          onMarkAllAsRead={markAllAsRead}
        />
      )}

      {/* ==========================================================================
          Vibecoding UI Layout Header Row:
          Aligned horizontally with Sidebar's top Brand Header row (h-8 pt-0 mb-3)
          ========================================================================== */}
      <header className={styles.topbar}>
        <div className={styles.left}>
          {onToggleMobileMenu && (
            <button
              type="button"
              className={styles.menuBtn}
              onClick={onToggleMobileMenu}
              aria-label="Toggle navigation menu"
              title="Toggle Menu"
            >
              <FiMenu size={16} />
            </button>
          )}

          {/* Breadcrumb / Back Bar ([Icon] Overview + ← Back button) */}
          <div className={styles.breadcrumbBar}>
            

            <div
              className={styles.breadcrumbItem}
              onClick={() => navigate('/admin/dashboard')}
              title="Overview"
            >
              <FiHome size={13} className={styles.breadcrumbHomeIcon} />
              <span className={styles.breadcrumbText}>Overview</span>
            </div>

            {!isDashboard && (
              <>
                <span className={styles.breadcrumbDivider}>/</span>
                <span className={styles.breadcrumbActivePage}>
                  {getBreadcrumbTitle(location.pathname)}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Header Right Actions */}
        <div className={styles.right}>
          <span className={styles.lastUpdatedText}>Last updated: Just now</span>

          {/* Notification Bell Dropdown Container */}
          <div className={styles.notificationWrapper} ref={dropdownRef}>
            <button
              type="button"
              className={styles.iconBtn}
              title="Notifications"
              aria-label="Notifications"
              onClick={() => setShowDropdown((prev) => !prev)}
            >
              <FiBell size={15} />
              {unreadCount > 0 && (
                <span className={styles.notificationBadge}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {showDropdown && (
              <div className={styles.notificationDropdown}>
                {/* Header */}
                <div className={styles.notifHeader}>
                  <div className={styles.notifTitleRow}>
                    <span className={styles.notifTitle}>Notifications</span>
                    {unreadCount > 0 && (
                      <span className={styles.notifCountPill}>{unreadCount} new</span>
                    )}
                  </div>
                  <div className={styles.notifActions}>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        className={styles.notifBtnAction}
                        onClick={markAllAsRead}
                        title="Mark all as read"
                      >
                        <FiCheck size={12} /> Mark read
                      </button>
                    )}
                    <button
                      type="button"
                      className={styles.notifBtnTest}
                      onClick={triggerTestRefund}
                      title="Simulate a new refund request notification to test WebSocket"
                    >
                      <FiZap size={11} className="text-warning" /> Test Noti
                    </button>
                  </div>
                </div>

                {/* Notifications List */}
                <div className={styles.notifList}>
                  {notifications.length === 0 ? (
                    <div className={styles.notifEmpty}>
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((item) => (
                      <div
                        key={item.notificationId}
                        className={`${styles.notifItem} ${!item.isRead ? styles.notifItemUnread : ""}`}
                        onClick={() => handleNotificationItemClick(item)}
                      >
                        <div className={styles.notifItemIcon}>
                          <FiRefreshCcw />
                        </div>
                        <div className={styles.notifItemContent}>
                          <div className={styles.notifItemTitleRow}>
                            <span className={styles.notifItemTitle}>{item.title}</span>
                            {!item.isRead && <span className={styles.notifItemDot} />}
                          </div>
                          <p className={styles.notifItemDesc}>{item.message}</p>
                          <span className={styles.notifItemTime}>{formatTimeAgo(item.createdAt)}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Footer link to Refunds Page */}
                <div className={styles.notifFooter}>
                  <button
                    type="button"
                    className={styles.notifFooterLink}
                    onClick={() => {
                      setShowDropdown(false);
                      navigate("/admin/refunds");
                    }}
                  >
                    View all in Refund Management &rarr;
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Clean Single User Profile Pill */}
          <div 
            className={styles.profileTrigger} 
            onClick={() => navigate('/admin/profile')}
            title="Go to My Profile"
          >
            <div className={styles.avatar}>{firstLetter}</div>
            <span className={styles.profileName}>{formatRole(role) || username || 'System Admin'}</span>
          </div>
        </div>
      </header>
    </>
  );
};
