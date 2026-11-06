import { useState, useRef, useEffect, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { orderApi } from "../features/orders/orderApi";
import { shippingApi } from "../features/shipping/shippingApi";
import {
  FiChevronRight as ChevronRight,
  FiRefreshCw as RefreshCw,
  FiPlus as Plus,
  FiChevronDown as ChevronDown,
  FiPackage as Package,
  FiFolderPlus as FolderPlus,
  FiUserPlus as UserPlus,
  FiBell as Bell,
  FiMenu,
  FiCheck,
} from "react-icons/fi";
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
  const dispatch = useDispatch();

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
    hasNotificationAccess,
  } = useNotificationSocket();

  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Quick Action ("+ Create") Dropdown state
  const [quickOpen, setQuickOpen] = useState(false);
  const quickActionRef = useRef<HTMLDivElement>(null);

  // Auto-Sync / Refresh State
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [syncText, setSyncText] = useState("Synced just now");

  // Close notifications dropdown on outside click
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

  // Close quick action dropdown on outside click
  useEffect(() => {
    const handleOutsideQuick = (e: MouseEvent) => {
      if (quickActionRef.current && !quickActionRef.current.contains(e.target as Node)) {
        setQuickOpen(false);
      }
    };
    if (quickOpen) {
      document.addEventListener("mousedown", handleOutsideQuick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideQuick);
    };
  }, [quickOpen]);

  // Handle Auto-Sync / Refresh click
  const handleRefresh = () => {
    setIsRefreshing(true);
    setSyncText("Syncing...");
    // Trigger global refresh event for any active page listeners
    // 1. Invalidate RTK Query caches across the app
    dispatch(orderApi.util.invalidateTags(['Order']));
    dispatch(shippingApi.util.invalidateTags(['ShippingZone']));
    // 2. Trigger global refresh event for any active page listeners
    window.dispatchEvent(new CustomEvent("admin:refresh"));
    setTimeout(() => {
      setIsRefreshing(false);
      setSyncText("Synced just now");
    }, 600);
  };

  // Role formatter
  const formatRole = (roleStr: string | null) => {
    if (roleStr === "BUSINESS_OWNER" || roleStr === "OWNER") return "Business Owner";
    if (roleStr === "ADMIN") return "System Admin";
    if (roleStr === "INVENTORY_STAFF") return "Inventory Staff";
    if (roleStr === "SALES_STAFF") return "Sales Staff";
    return roleStr || "Staff";
  };

  const firstLetter = username ? username.charAt(0).toUpperCase() : 'S';

  const isRefundNotif = (item: AdminNotificationItem) => {
    return (
      item.type === "REFUND_REQUEST" ||
      item.type?.toUpperCase().includes("REFUND") ||
      item.title?.toLowerCase().includes("refund") ||
      item.link?.includes("/admin/refunds")
    );
  };

  const handleNotificationItemClick = (item: AdminNotificationItem) => {
    if (!item.isRead) {
      markAsRead(item.notificationId);
    }
    setShowDropdown(false);
    // Only navigate to /admin/refunds if it is a refund notification
    if (isRefundNotif(item)) {
      navigate("/admin/refunds");
    } else if (item.link && item.link !== "/admin/refunds") {
      navigate(item.link);
    }
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

  // Dynamic Breadcrumb Trail Parser based on location.pathname
  const breadcrumbTrail = useMemo(() => {
    const p = location.pathname;
    if (p === "/admin" || p === "/admin/dashboard" || p === "/admin/dashboard/") {
      return { isDashboard: true, parentSection: "Dashboard", subSection: "", currentPageTitle: "" };
    }
    if (p.startsWith("/admin/products/new")) {
      return { isDashboard: false, parentSection: "Catalogue", subSection: "Product List", currentPageTitle: "Add New" };
    }
    if (p.includes("/admin/products/edit")) {
      return { isDashboard: false, parentSection: "Catalogue", subSection: "Product List", currentPageTitle: "Edit Product" };
    }
    if (p.startsWith("/admin/products") || p.startsWith("/productlist")) {
      return { isDashboard: false, parentSection: "Catalogue", subSection: "", currentPageTitle: "Product List" };
    }
    if (p.startsWith("/admin/inventory")) {
      return { isDashboard: false, parentSection: "Catalog & Stock", subSection: "", currentPageTitle: "Inventory" };
    }
    if (p.startsWith("/admin/categories")) {
      return { isDashboard: false, parentSection: "Catalogue", subSection: "", currentPageTitle: "Categories" };
    }
    if (p.startsWith("/admin/brands")) {
      return { isDashboard: false, parentSection: "Catalogue", subSection: "", currentPageTitle: "Brands" };
    }
    if (p.startsWith("/admin/tags")) {
      return { isDashboard: false, parentSection: "Catalogue", subSection: "", currentPageTitle: "Tags" };
    }
    if (p.startsWith("/admin/variants") || p.startsWith("/admin/variations")) {
      return { isDashboard: false, parentSection: "Catalogue", subSection: "", currentPageTitle: "SKU & Attributes" };
    }
    if (p.startsWith("/admin/orders/new")) {
      return { isDashboard: false, parentSection: "Operations", subSection: "Orders", currentPageTitle: "Create Order" };
    }
    if (p.startsWith("/admin/orders")) {
      return { isDashboard: false, parentSection: "Operations", subSection: "", currentPageTitle: "Orders" };
    }
    if (p.startsWith("/admin/refunds")) {
      return { isDashboard: false, parentSection: "Operations", subSection: "", currentPageTitle: "Refunds" };
    }
    if (p.startsWith("/admin/shipping-rates")) {
      return { isDashboard: false, parentSection: "Operations", subSection: "", currentPageTitle: "Shipping Rates" };
    }
    if (p.startsWith("/admin/staff/new")) {
      return { isDashboard: false, parentSection: "Team", subSection: "Staff", currentPageTitle: "Add Staff" };
    }
    if (p.includes("/admin/staff/edit")) {
      return { isDashboard: false, parentSection: "Team", subSection: "Staff", currentPageTitle: "Edit Staff" };
    }
    if (p.startsWith("/admin/staff")) {
      return { isDashboard: false, parentSection: "Team", subSection: "", currentPageTitle: "Staff" };
    }
    if (p.startsWith("/admin/reports")) {
      return { isDashboard: false, parentSection: "Analytics", subSection: "", currentPageTitle: "Reports" };
    }
    if (p.startsWith("/admin/audit-logs")) {
      return { isDashboard: false, parentSection: "System", subSection: "", currentPageTitle: "Audit Logs" };
    }
    if (p.startsWith("/admin/profile")) {
      return { isDashboard: false, parentSection: "Account", subSection: "", currentPageTitle: "My Profile" };
    }
    return { isDashboard: false, parentSection: "Admin", subSection: "", currentPageTitle: "Dashboard" };
  }, [location.pathname]);

  return (
    <>
      {/* 1. Real-time Toast Notification (Pop-up upon new refund event) */}
      {hasNotificationAccess && activeToast && (
        <NotificationToast
          notification={activeToast}
          onClose={dismissToast}
          onRead={markAsRead}
        />
      )}

      {/* 2. Login Unread Notifications Alert Dialog (Appears upon login if unread requests exist) */}
      {hasNotificationAccess && showLoginAlert && (
        <LoginUnreadModal
          unreadCount={unreadCount}
          items={loginAlertItems}
          onClose={dismissLoginAlert}
          onMarkAllAsRead={markAllAsRead}
        />
      )}

      {/* ==========================================================================
          Vibecoding UI Header Bar (Aligned strictly with Vectra Design System)
          ========================================================================== */}
      <div className="flex items-center justify-between w-full h-full">
        {/* Left-Side: Mobile Menu Toggle & Dynamic Breadcrumbs */}
        <div className="flex items-center">
          <button
            type="button"
            className={styles.menuBtn}
            onClick={onToggleMobileMenu}
            aria-label="Toggle mobile menu"
            style={{ marginRight: "12px" }}
          >
            <FiMenu size={16} />
          </button>

          {/* Dynamic Breadcrumbs */}
          <nav className="flex items-center gap-2 text-xs font-medium tracking-tight">
            {breadcrumbTrail.isDashboard ? (
              <span className="text-slate-800 font-semibold">Dashboard</span>
            ) : (
              <>
                <span className="text-slate-400 font-normal capitalize">{breadcrumbTrail.parentSection || 'Dashboard'}</span>
                {breadcrumbTrail.subSection && (
                  <>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                    <span className="text-slate-400 font-normal capitalize">{breadcrumbTrail.subSection}</span>
                  </>
                )}
                {breadcrumbTrail.currentPageTitle && (
                  <>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                    <span className="text-slate-800 font-semibold">{breadcrumbTrail.currentPageTitle}</span>
                  </>
                )}
              </>
            )}
          </nav>
        </div>

        {/* Right-Side Features (Utilities & Actions): Wrapped in flex items-center gap-2.5 */}
        <div className="flex items-center gap-2.5">
          {/* A. "Synced just now" Status Pill: Clean soft pill with seamless borderless Sync logo */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50/80 border border-slate-200/80 text-[11px] font-medium text-slate-500 shadow-sm shadow-slate-100/50">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{syncText}</span>
            <button
              type="button"
              onClick={handleRefresh}
              title="Click to refresh data"
              className="text-slate-400 hover:text-slate-700 transition-colors inline-flex items-center justify-center p-0 cursor-pointer focus:outline-none"
              style={{ border: 'none', background: 'transparent', padding: 0, outline: 'none', boxShadow: 'none' }}
            >
              <RefreshCw className={`w-3.5 h-3.5 transition-transform duration-300 ${isRefreshing ? "animate-spin text-blue-600" : "hover:rotate-180"}`} />
            </button>
          </div>

          {/* B. "+ Create" Button: Hidden on Dashboard */}
          {!breadcrumbTrail.isDashboard && (
            <div className="relative" ref={quickActionRef}>
              <button
                type="button"
                onClick={() => setQuickOpen(!quickOpen)}
                className={styles.createBtn}
                title="Quick actions"
              >
                <Plus size={14} />
                <span>Create</span>
                <ChevronDown size={12} style={{ opacity: 0.8 }} />
              </button>

              {/* Dropdown Menu (Z-index 50) */}
              {quickOpen && (
                <div className={styles.createMenu}>
                  {(role === 'ADMIN' || role === 'INVENTORY_STAFF') && (
                  <Link
                    to="/admin/products/new"
                    onClick={() => setQuickOpen(false)}
                    className={styles.createMenuItem}
                  >
                    <Package className={styles.createMenuIcon} />
                    <span>Add New Product</span>
                  </Link>
                  )}
                  {(role === 'ADMIN' || role === 'INVENTORY_STAFF') && (
                  <Link
                    to="/admin/categories?create=true"
                    onClick={() => setQuickOpen(false)}
                    className={styles.createMenuItem}
                  >
                    <FolderPlus className={styles.createMenuIcon} />
                    <span>Create Category</span>
                  </Link>
                  )}
                  {role === 'ADMIN' && (
                  <Link
                    to="/admin/staff/new"
                    onClick={() => setQuickOpen(false)}
                    className={styles.createMenuItem}
                  >
                    <UserPlus className={styles.createMenuIcon} />
                    <span>Add Staff Member</span>
                  </Link>
                  )}
                </div>
              )}
            </div>
          )}

          {/* C. Notification Bell Icon: Prominent high-contrast button matching UI design tokens */}
          {hasNotificationAccess && (
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setShowDropdown((prev) => !prev)}
              className={styles.bellBtn}
              title="Notifications"
              aria-label="Notifications"
            >
              <Bell className={styles.bellIcon} />
              {unreadCount > 0 && (
                <span className={styles.bellBadge}></span>
              )}
            </button>

            {/* Notification Dropdown with real-time alerts */}
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
                          <RefreshCw />
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

                {/* Footer link to Refunds Page (only shown if refund notifications exist) */}
                {notifications.some(isRefundNotif) && (
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
                )}
              </div>
            )}
          </div>
          )}

          {/* D. Profile Avatar Alignment: Clean avatar and text matching sidebar bottom */}
          <div 
            onClick={() => navigate('/admin/profile')}
            className="flex items-center gap-2 pl-2 border-l border-slate-200/60 ml-1 cursor-pointer hover:opacity-85 transition-opacity"
            title="Go to My Profile"
          >
            <div className="w-7 h-7 rounded-lg bg-slate-900 text-white text-[11px] font-semibold flex items-center justify-center">
              {firstLetter}
            </div>
            <span className="text-xs font-semibold text-slate-800 hidden sm:inline">
              {formatRole(role) || username || 'System Admin'}
            </span>
          </div>
        </div>
      </div>
    </>
  );
};
