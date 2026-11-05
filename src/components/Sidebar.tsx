import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { type RootState } from '../store';
import { logout } from '../features/auth/authSlice';
import api from '../utils/axiosConfig';
import styles from './Sidebar.module.css';

import {
  FiChevronDown,
  FiChevronsLeft,
  FiChevronsRight,
  FiHome,
  FiShoppingCart,
  FiPackage,
  FiBox,
  FiUsers,
  FiLayers,
  FiFolder,
  FiTag,
  FiGrid,
  FiTruck,
  FiUserPlus,
  FiBarChart2,
  FiFileText,
  FiRotateCcw,
  FiLogOut,
  FiX,
} from 'react-icons/fi';

interface SidebarProps {
  onCloseMobile?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onCloseMobile,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { username, role, permissions, email } = useSelector(
    (state: RootState) => state.auth
  );
  const firstLetter = username ? username.charAt(0).toUpperCase() : 'A';

  const [userAvatar, setUserAvatar] = useState<string | null>(() => {
    return (
      localStorage.getItem(`avatar_${email?.toLowerCase()}`) ||
      localStorage.getItem(`avatar_${email}`) ||
      localStorage.getItem(`avatar_${username?.toLowerCase()}`) ||
      localStorage.getItem(`avatar_${username}`) ||
      localStorage.getItem('currentUserAvatar') ||
      null
    );
  });

  useEffect(() => {
    const handleAvatarUpdate = () => {
      const updated =
        localStorage.getItem(`avatar_${email?.toLowerCase()}`) ||
        localStorage.getItem(`avatar_${email}`) ||
        localStorage.getItem(`avatar_${username?.toLowerCase()}`) ||
        localStorage.getItem(`avatar_${username}`) ||
        localStorage.getItem('currentUserAvatar') ||
        null;
      setUserAvatar(updated);
    };
    window.addEventListener('avatarChange', handleAvatarUpdate);
    window.addEventListener('storage', handleAvatarUpdate);
    return () => {
      window.removeEventListener('avatarChange', handleAvatarUpdate);
      window.removeEventListener('storage', handleAvatarUpdate);
    };
  }, [email, username]);

  const formatRole = (roleStr: string | null): string => {
    if (roleStr === 'ADMIN') return 'System Admin';
    if (roleStr === 'INVENTORY_STAFF') return 'Inventory Staff';
    if (roleStr === 'SALES_STAFF' || roleStr === 'ORDER_STAFF') return 'Order / Sales Staff';
    return roleStr || 'Staff';
  };

  const getProfileSubtitle = (): string => {
    if (email && email.includes('@')) return email;
    const formatted = formatRole(role);
    if (username && username.trim().toLowerCase() === formatted.trim().toLowerCase()) {
      return 'Administrator';
    }
    return formatted;
  };

  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } catch {} finally { dispatch(logout()); navigate('/login'); }

  };

  const isAdmin = role === 'ADMIN';
  const isInventoryStaff = role === 'INVENTORY_STAFF';
  const isOrderStaff = role === 'ORDER_STAFF' || role === 'SALES_STAFF';

  const canAccessCatalog = isAdmin || isInventoryStaff || permissions?.includes('MANAGE_PRODUCT');
  const canAccessInventory = isAdmin || isInventoryStaff || permissions?.includes('MANAGE_INVENTORY');
  const canAccessOperations = isAdmin || isOrderStaff || permissions?.includes('VIEW_ORDERS') || permissions?.includes('MANAGE_ORDERS');
  const canAccessStaff = isAdmin || permissions?.includes('MANAGE_STAFF');
  const canAccessReports = isAdmin;

  const handleLinkClick = () => {
    if (onCloseMobile) onCloseMobile();
  };

  // Active checks
  const isCatalogActive =
    location.pathname.startsWith('/admin/products') ||
    location.pathname.startsWith('/admin/categories') ||
    location.pathname.startsWith('/admin/brands') ||
    location.pathname.startsWith('/admin/tags') ||
    location.pathname.startsWith('/admin/variants') ||
    location.pathname.startsWith('/admin/variations');

  const isStaffActive = location.pathname.startsWith('/admin/staff');

  const [catalogOpen, setCatalogOpen] = useState<boolean>(() => isCatalogActive);
  const [staffOpen, setStaffOpen] = useState<boolean>(() => isStaffActive);

  // Auto-expand active dropdown when path changes
  useEffect(() => {
    if (isCatalogActive) setCatalogOpen(true);
    if (isStaffActive) setStaffOpen(true);
  }, [isCatalogActive, isStaffActive]);

  const handleDropdownToggle = (type: 'catalog' | 'staff') => {
    if (isCollapsed && onToggleCollapse) {
      onToggleCollapse();
    }
    if (type === 'catalog') setCatalogOpen(!catalogOpen);
    if (type === 'staff') setStaffOpen(!staffOpen);
  };

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isCollapsed && onToggleCollapse) {
      onToggleCollapse();
    } else {
      navigate('/admin/dashboard');
    }
    if (onCloseMobile) onCloseMobile();
  };

  const navClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? `${styles.link} ${styles.active}` : styles.link;

  const subNavClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? `${styles.subLink} ${styles.subActive}` : styles.subLink;

  return (
    <aside className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''}`}>
      {/* Upper Navigation Block */}
      <div className={styles.topSection}>
        {/* ==========================================================================
            1. Brand Header Row (38px height, modern logo badge)
            ========================================================================== */}
        <div className={styles.header}>
          <div
            className={styles.brandContainer}
            title={isCollapsed ? 'Click to expand sidebar' : 'Ecommerce Admin'}
            onClick={handleLogoClick}
            role="button"
            tabIndex={0}
          >
            {/* Modern Larger Dual-Tone Brand Logo */}
            <div className={styles.logoBadge} aria-label="Ecommerce Logo">
              <svg
                width="19"
                height="19"
                viewBox="0 0 28 28"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <linearGradient id="brandSparkGrad" x1="9" y1="11" x2="19" y2="19" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#2563eb" />
                    <stop offset="1" stopColor="#7c3aed" />
                  </linearGradient>
                </defs>
                {/* Modern Shopping Bag Form */}
                <rect x="4" y="8" width="20" height="16" rx="4.5" fill="#ffffff" />
                {/* Sleek Curved Handle */}
                <path
                  d="M10 8V6C10 3.79086 11.7909 2 14 2C16.2091 2 18 3.79086 18 6V8"
                  stroke="#ffffff"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                />
                {/* Dynamic Center Retail Spark */}
                <path
                  d="M14 11.5L14.9 14.1L17.5 15L14.9 15.9L14 18.5L13.1 15.9L10.5 15L13.1 14.1L14 11.5Z"
                  fill="url(#brandSparkGrad)"
                />
              </svg>
            </div>
            {!isCollapsed && (
              <div className={styles.brandMeta}>
                <span className={styles.brandName}>Ecommerce</span>
                <span className={styles.brandBadge}>Admin</span>
              </div>
            )}
          </div>

          {/* Right: Collapse / Expand Toggle Button */}
          {onToggleCollapse && (
            <button
              type="button"
              className={styles.toggleCollapseBtn}
              onClick={onToggleCollapse}
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? <FiChevronsRight size={14} /> : <FiChevronsLeft size={14} />}
            </button>
          )}

          {/* Mobile Close Button */}
          {onCloseMobile && (
            <button
              type="button"
              className={styles.mobileCloseBtn}
              onClick={onCloseMobile}
              aria-label="Close Sidebar"
            >
              <FiX size={16} />
            </button>
          )}
        </div>

        {/* ==========================================================================
            2. Navigation Menu Items
            ========================================================================== */}
        <nav
          className={styles.navContainer}
          onClick={(e) => {
            if ((e.target as HTMLElement).closest('a')) {
              handleLinkClick();
            }
          }}
        >
          {/* Section: Overview */}
          <div className={styles.navSectionTitle}>Navigation</div>
          <NavLink to="/admin/dashboard" className={navClass} title="Dashboard">
            <div className={styles.linkLeftGroup}>
              <FiHome className={styles.linkIcon} />
              <span className={styles.linkLabel}>Dashboard</span>
            </div>
          </NavLink>

          {/* Section: Catalog & Stock */}
          {(canAccessCatalog || canAccessInventory) && (
            <>
              <div className={styles.navSectionTitle}>Catalog &amp; Stock</div>

              {/* Product Catalog Dropdown */}
              {canAccessCatalog && (
                <div className={styles.dropdownGroup}>
                  <button
                    type="button"
                    className={`${styles.dropdownToggle} ${
                      isCatalogActive ? styles.parentActive : ''
                    }`}
                    onClick={() => handleDropdownToggle('catalog')}
                    title="Product Catalog"
                    aria-expanded={catalogOpen}
                  >
                    <div className={styles.linkLeftGroup}>
                      <FiPackage className={styles.linkIcon} />
                      <span className={styles.linkLabel}>Product Catalog</span>
                    </div>
                    <FiChevronDown
                      className={`${styles.chevron} ${
                        catalogOpen ? styles.chevronOpen : ''
                      }`}
                    />
                  </button>

                  {catalogOpen && !isCollapsed && (
                    <div className={styles.submenu}>
                      <NavLink
                        to="/admin/products"
                        end
                        className={subNavClass}
                        title="Product List"
                      >
                        <FiPackage className={styles.subIcon} />
                        <span className={styles.subLabel}>Product List</span>
                      </NavLink>

                      <NavLink
                        to="/admin/categories"
                        className={subNavClass}
                        title="Categories"
                      >
                        <FiFolder className={styles.subIcon} />
                        <span className={styles.subLabel}>Categories</span>
                      </NavLink>

                      <NavLink
                        to="/admin/brands"
                        className={subNavClass}
                        title="Brands"
                      >
                        <FiTag className={styles.subIcon} />
                        <span className={styles.subLabel}>Brands</span>
                      </NavLink>

                      <NavLink
                        to="/admin/tags"
                        className={subNavClass}
                        title="Tags"
                      >
                        <FiGrid className={styles.subIcon} />
                        <span className={styles.subLabel}>Tags</span>
                      </NavLink>

                      <NavLink
                        to="/admin/variants"
                        className={subNavClass}
                        title="SKU &amp; Attributes"
                      >
                        <FiLayers className={styles.subIcon} />
                        <span className={styles.subLabel}>SKU &amp; Attributes</span>
                      </NavLink>
                    </div>
                  )}
                </div>
              )}

              {/* Stock Management */}
              {canAccessInventory && (
                <NavLink to="/admin/inventory" className={navClass} title="Stock Management">
                  <div className={styles.linkLeftGroup}>
                    <FiBox className={styles.linkIcon} />
                    <span className={styles.linkLabel}>Stock Management</span>
                  </div>
                </NavLink>
              )}
            </>
          )}

          {/* Section: Operations */}
          {canAccessOperations && (
            <>
              <div className={styles.navSectionTitle}>Operations</div>

              <NavLink to="/admin/orders" className={navClass} title="Orders">
                <div className={styles.linkLeftGroup}>
                  <FiShoppingCart className={styles.linkIcon} />
                  <span className={styles.linkLabel}>Orders</span>
                </div>
              </NavLink>

              <NavLink to="/admin/refunds" className={navClass} title="Refunds">
                <div className={styles.linkLeftGroup}>
                  <FiRotateCcw className={styles.linkIcon} />
                  <span className={styles.linkLabel}>Refunds</span>
                </div>
              </NavLink>

              <NavLink
                to="/admin/shipping-rates"
                className={navClass}
                title="Shipping Rates"
              >
                <div className={styles.linkLeftGroup}>
                  <FiTruck className={styles.linkIcon} />
                  <span className={styles.linkLabel}>Shipping Rates</span>
                </div>
              </NavLink>
            </>
          )}

          {/* Section: Staff & Admin Management */}
          {canAccessStaff && (
            <>
              <div className={styles.navSectionTitle}>Team</div>

              <div className={styles.dropdownGroup}>
                <button
                  type="button"
                  className={`${styles.dropdownToggle} ${
                    isStaffActive ? styles.parentActive : ''
                  }`}
                  onClick={() => handleDropdownToggle('staff')}
                  title="Staff & Administrator Management"
                >
                  <div className={styles.linkLeftGroup}>
                    <FiUsers className={styles.linkIcon} />
                    <span className={styles.linkLabel}>Staff &amp; Admin</span>
                  </div>
                  <FiChevronDown
                    className={`${styles.chevron} ${
                      staffOpen ? styles.chevronOpen : ''
                    }`}
                  />
                </button>

                {staffOpen && !isCollapsed && (
                  <div className={styles.submenu}>
                    <NavLink to="/admin/staff" end className={subNavClass} title="All Accounts">
                      <FiUsers size={13} className={styles.subIcon} />
                      <span>All Accounts</span>
                    </NavLink>
                    <NavLink to="/admin/staff/new" className={subNavClass} title="Add New Account">
                      <FiUserPlus size={13} className={styles.subIcon} />
                      <span>Add New Account</span>
                    </NavLink>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Section: Reports & Analytics */}
          {canAccessReports && (
            <>
              <div className={styles.navSectionTitle}>Analytics</div>
              <NavLink to="/admin/reports" className={navClass} title="Reports & Analytics">
                <div className={styles.linkLeftGroup}>
                  <FiBarChart2 className={styles.linkIcon} />
                  <span className={styles.linkLabel}>Reports &amp; Analytics</span>
                </div>
              </NavLink>
            </>
          )}

          {/* Section: System (Audit Logs) */}
          {isAdmin && (
            <>
              <div className={styles.navSectionTitle}>System</div>
              <NavLink to="/admin/audit-logs" className={navClass} title="Audit Logs">
                <div className={styles.linkLeftGroup}>
                  <FiFileText className={styles.linkIcon} />
                  <span className={styles.linkLabel}>Audit Logs</span>
                </div>
              </NavLink>
            </>
          )}


        </nav>
      </div>

      {/* ==========================================================================
          3. User Profile Footer with Clean Log Out Action
          ========================================================================== */}
      {!isCollapsed ? (
        <div className={styles.sidebarFooter}>
          {/* User Profile Card */}
          <div
            className={styles.userProfileCard}
            onClick={() => navigate('/admin/profile')}
            title="My Profile"
          >
            <div className={styles.avatarLeft}>
              <div className={styles.avatarBox}>
                {userAvatar ? (
                  <img src={userAvatar} alt="Profile" className={styles.avatarImg} />
                ) : (
                  firstLetter
                )}
              </div>
              <div className={styles.userMeta}>
                <span className={styles.userName}>{username || 'System Admin'}</span>
                <span className={styles.userRole}>{getProfileSubtitle()}</span>
              </div>
            </div>
          </div>

          {/* Expanded Log Out Button with Icon and Text */}
          <button
            type="button"
            className={styles.expandedLogoutBtn}
            onClick={handleLogout}
            title="Log Out"
          >
            <FiLogOut size={15} />
            <span>Log Out</span>
          </button>
        </div>
      ) : (
        <div className={styles.sidebarFooterCollapsed}>
          <div
            className={styles.avatarBoxCollapsed}
            onClick={() => navigate('/admin/profile')}
            title={`${username || 'Admin'} (${getProfileSubtitle()})`}
          >
            {userAvatar ? (
              <img src={userAvatar} alt="Profile" className={styles.avatarImg} />
            ) : (
              firstLetter
            )}
            <span className={styles.onlineDotCollapsed} />
          </div>
          <button
            type="button"
            className={styles.footerLogoutBtnCollapsed}
            onClick={handleLogout}
            title="Log Out"
            aria-label="Log Out"
          >
            <FiLogOut size={16} />
          </button>
        </div>
      )}
    </aside>
  );
};
