import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { type RootState } from '../store';
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
  FiSearch,
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
  const navigate = useNavigate();
  const location = useLocation();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { username, role, permissions, email } = useSelector(
    (state: RootState) => state.auth
  );
  const firstLetter = username ? username.charAt(0).toUpperCase() : 'A';

  const formatRole = (roleStr: string | null): string => {
    if (roleStr === 'BUSINESS_OWNER' || roleStr === 'OWNER') return 'Business Owner';
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

  const isInventoryActive = location.pathname.startsWith('/admin/inventory');
  const isStaffActive = location.pathname.startsWith('/admin/staff');

  const [catalogOpen, setCatalogOpen] = useState<boolean>(() => isCatalogActive);
  const [inventoryOpen, setInventoryOpen] = useState<boolean>(() => isInventoryActive);
  const [staffOpen, setStaffOpen] = useState<boolean>(() => isStaffActive);

  // Auto-expand active dropdown when path changes
  useEffect(() => {
    if (isCatalogActive) setCatalogOpen(true);
    if (isInventoryActive) setInventoryOpen(true);
    if (isStaffActive) setStaffOpen(true);
  }, [isCatalogActive, isInventoryActive, isStaffActive]);

  const handleDropdownToggle = (type: 'catalog' | 'inventory' | 'staff') => {
    if (isCollapsed && onToggleCollapse) {
      onToggleCollapse();
    }
    if (type === 'catalog') setCatalogOpen(!catalogOpen);
    if (type === 'inventory') setInventoryOpen(!inventoryOpen);
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

  // Real-time live search logic with keyword & synonym matching
  const q = searchQuery.trim().toLowerCase();
  const isSearching = q.length > 0;

  const matches = (label: string, synonyms: string[] = []) => {
    if (!isSearching) return true;
    if (label.toLowerCase().includes(q)) return true;
    return synonyms.some((syn) => syn.toLowerCase().includes(q));
  };

  const matchDashboard = matches('Dashboard', ['overview', 'home', 'stats', 'analytics']);
  const matchProducts = matches('Product List', ['items', 'products', 'inventory']);
  const matchCategories = matches('Categories', ['taxonomy', 'types', 'category']);
  const matchBrands = matches('Brands', ['labels', 'makers', 'manufacturers', 'brand']);
  const matchTags = matches('Tags', ['labels', 'badges', 'tag']);
  const matchVariants = matches('Variants & Options', ['sizes', 'colors', 'attributes', 'variations', 'variant']);
  const matchStock = matches('Stock Management', ['inventory', 'units', 'warehouse', 'stock']);
  const matchLowStock = matches('Low Stock Alerts', ['alerts', 'out of stock', 'warning', 'restock']);
  const matchOrders = matches('Orders', ['sales', 'purchases', 'transactions', 'order']);
  const matchRefunds = matches('Refunds', ['returns', 'claims', 'reversals', 'refund']);
  const matchShipping = matches('Shipping Rates', ['delivery', 'zones', 'shipping', 'courier', 'rates']);
  const matchStaffList = matches('All Staff', ['users', 'employees', 'team', 'accounts', 'staff']);
  const matchCreateStaff = matches('Add New Staff', ['create user', 'invite', 'new employee', 'add staff']);
  const matchReports = matches('Reports & Analytics', ['reports', 'sales report', 'export', 'charts', 'data', 'analytics']);
  const matchAuditLogs = matches('Audit Logs', ['logs', 'audit', 'activity', 'history', 'security']);

  const hasCatalogMatches = canAccessCatalog && (matchProducts || matchCategories || matchBrands || matchTags || matchVariants);
  const hasInventoryMatches = canAccessInventory && (matchStock || matchLowStock);
  const hasOperationsMatches = canAccessOperations && (matchOrders || matchRefunds || matchShipping);
  const hasStaffMatches = canAccessStaff && (matchStaffList || matchCreateStaff);
  const hasAnalyticsMatches = canAccessReports && matchReports;
  const hasSystemMatches = isAdmin && matchAuditLogs;

  const totalMatchesCount =
    (matchDashboard ? 1 : 0) +
    (hasCatalogMatches ? 1 : 0) +
    (hasInventoryMatches ? 1 : 0) +
    (hasOperationsMatches ? 1 : 0) +
    (hasStaffMatches ? 1 : 0) +
    (hasAnalyticsMatches ? 1 : 0) +
    (hasSystemMatches ? 1 : 0);

  return (
    <aside className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''}`}>
      {/* Upper Navigation Block */}
      <div className={styles.topSection}>
        {/* ==========================================================================
            1. Brand Header Row (38px height, 32px modern logo badge)
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
            2. Live Search Box (No ⌘K shortcut badge, real-time live filtering)
            ========================================================================== */}
        {!isCollapsed ? (
          <div className={styles.searchBox}>
            <div className={styles.searchLeft}>
              <FiSearch className={styles.searchIcon} size={15} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search menu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setSearchQuery('');
                }}
                className={styles.searchInput}
              />
            </div>
            {searchQuery && (
              <button
                type="button"
                className={styles.searchClearBtn}
                onClick={() => {
                  setSearchQuery('');
                  searchInputRef.current?.focus();
                }}
                title="Clear search"
                aria-label="Clear search"
              >
                <FiX size={13} />
              </button>
            )}
          </div>
        ) : (
          <button
            type="button"
            className={styles.searchBoxCollapsed}
            onClick={() => {
              if (onToggleCollapse) onToggleCollapse();
              setTimeout(() => searchInputRef.current?.focus(), 150);
            }}
            title="Search menu"
            aria-label="Search menu"
          >
            <FiSearch size={15} />
          </button>
        )}

        {/* ==========================================================================
            3. Navigation Menu Items (Live filtered)
            ========================================================================== */}
        <nav
          className={styles.navContainer}
          onClick={(e) => {
            if ((e.target as HTMLElement).closest('a')) {
              handleLinkClick();
            }
          }}
        >
          {/* Live Search: Empty State when nothing matches */}
          {isSearching && totalMatchesCount === 0 && (
            <div className={styles.noSearchResults}>
              <FiSearch size={20} className={styles.noSearchIcon} />
              <p className={styles.noSearchText}>No menu matches for "{searchQuery}"</p>
              <button
                type="button"
                className={styles.noSearchResetBtn}
                onClick={() => setSearchQuery('')}
              >
                Clear search
              </button>
            </div>
          )}

          {/* Section: Overview */}
          {matchDashboard ? (
            <>
              <div className={styles.navSectionTitle}>Navigation</div>
              <NavLink to="/admin/dashboard" className={navClass} title="Dashboard">
                <div className={styles.linkLeftGroup}>
                  <FiHome className={styles.linkIcon} />
                  <span className={styles.linkLabel}>Dashboard</span>
                </div>
              </NavLink>
            </>
          ) : null}

          {/* Section: Catalog & Stock */}
          {(canAccessCatalog || canAccessInventory) && (
            <>
              {(hasCatalogMatches || hasInventoryMatches) && (
                <div className={styles.navSectionTitle}>Catalog &amp; Stock</div>
              )}

              {/* Product Catalog Dropdown */}
              {canAccessCatalog && hasCatalogMatches && (
                <div className={styles.dropdownGroup}>
                  <button
                    type="button"
                    className={`${styles.dropdownToggle} ${
                      isCatalogActive ? styles.parentActive : ''
                    }`}
                    onClick={() => handleDropdownToggle('catalog')}
                    title="Product Catalog"
                  >
                    <div className={styles.linkLeftGroup}>
                      <FiPackage className={styles.linkIcon} />
                      <span className={styles.linkLabel}>Product Catalog</span>
                    </div>
                    <FiChevronDown
                      className={`${styles.chevron} ${
                        catalogOpen || isSearching ? styles.chevronRotated : ''
                      }`}
                    />
                  </button>

                  {(!isCollapsed ? (catalogOpen || isSearching) : false) && (
                    <div className={styles.submenu}>
                      {matchProducts && (
                        <NavLink to="/admin/products" end className={subNavClass} title="Product List">
                          <FiPackage size={13} className={styles.subIcon} />
                          <span>Product List</span>
                        </NavLink>
                      )}
                      {matchCategories && (
                        <NavLink to="/admin/categories" className={subNavClass} title="Categories">
                          <FiFolder size={13} className={styles.subIcon} />
                          <span>Categories</span>
                        </NavLink>
                      )}
                      {matchBrands && (
                        <NavLink to="/admin/brands" className={subNavClass} title="Brands">
                          <FiGrid size={13} className={styles.subIcon} />
                          <span>Brands</span>
                        </NavLink>
                      )}
                      {matchTags && (
                        <NavLink to="/admin/tags" className={subNavClass} title="Tags">
                          <FiTag size={13} className={styles.subIcon} />
                          <span>Tags</span>
                        </NavLink>
                      )}
                      {matchVariants && (
                        <NavLink to="/admin/variants" className={subNavClass} title="Variants & Options">
                          <FiLayers size={13} className={styles.subIcon} />
                          <span>Variants &amp; Options</span>
                        </NavLink>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Inventory & Stock Management */}
              {canAccessInventory && hasInventoryMatches && (
                <div className={styles.dropdownGroup}>
                  <button
                    type="button"
                    className={`${styles.dropdownToggle} ${
                      isInventoryActive ? styles.parentActive : ''
                    }`}
                    onClick={() => handleDropdownToggle('inventory')}
                    title="Inventory"
                  >
                    <div className={styles.linkLeftGroup}>
                      <FiBox className={styles.linkIcon} />
                      <span className={styles.linkLabel}>Inventory</span>
                    </div>
                    <FiChevronDown
                      className={`${styles.chevron} ${
                        inventoryOpen || isSearching ? styles.chevronRotated : ''
                      }`}
                    />
                  </button>

                  {(!isCollapsed ? (inventoryOpen || isSearching) : false) && (
                    <div className={styles.submenu}>
                      {matchStock && (
                        <NavLink to="/admin/inventory" end className={subNavClass} title="Stock Management">
                          <FiBox size={13} className={styles.subIcon} />
                          <span>Stock Management</span>
                        </NavLink>
                      )}
                      {matchLowStock && (
                        <NavLink
                          to="/admin/inventory?tab=low-stock"
                          className={subNavClass}
                          title="Low Stock Alerts"
                        >
                          <span className={styles.warningDot} />
                          <span>Low Stock Alerts</span>
                        </NavLink>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Section: Operations */}
          {canAccessOperations && hasOperationsMatches && (
            <>
              <div className={styles.navSectionTitle}>Operations</div>

              {matchOrders && (
                <NavLink to="/admin/orders" className={navClass} title="Orders">
                  <div className={styles.linkLeftGroup}>
                    <FiShoppingCart className={styles.linkIcon} />
                    <span className={styles.linkLabel}>Orders</span>
                  </div>
                </NavLink>
              )}

              {matchRefunds && (
                <NavLink to="/admin/refunds" className={navClass} title="Refunds">
                  <div className={styles.linkLeftGroup}>
                    <FiRotateCcw className={styles.linkIcon} />
                    <span className={styles.linkLabel}>Refunds</span>
                  </div>
                </NavLink>
              )}

              {matchShipping && (
                <NavLink to="/admin/shipping-rates" className={navClass} title="Shipping Rates">
                  <div className={styles.linkLeftGroup}>
                    <FiTruck className={styles.linkIcon} />
                    <span className={styles.linkLabel}>Shipping Rates</span>
                  </div>
                </NavLink>
              )}
            </>
          )}

          {/* Section: Staff Management */}
          {canAccessStaff && hasStaffMatches && (
            <>
              <div className={styles.navSectionTitle}>Management</div>

              <div className={styles.dropdownGroup}>
                <button
                  type="button"
                  className={`${styles.dropdownToggle} ${
                    isStaffActive ? styles.parentActive : ''
                  }`}
                  onClick={() => handleDropdownToggle('staff')}
                  title="Staff & Admin Management"
                >
                  <div className={styles.linkLeftGroup}>
                    <FiUsers className={styles.linkIcon} />
                    <span className={styles.linkLabel}>Staff &amp; Admin</span>
                  </div>
                  <FiChevronDown
                    className={`${styles.chevron} ${
                      staffOpen || isSearching ? styles.chevronRotated : ''
                    }`}
                  />
                </button>

                {(!isCollapsed ? (staffOpen || isSearching) : false) && (
                  <div className={styles.submenu}>
                    {matchStaffList && (
                      <NavLink to="/admin/staff" end className={subNavClass} title="All Accounts">
                        <FiUsers size={13} className={styles.subIcon} />
                        <span>All Accounts</span>
                      </NavLink>
                    )}
                    {matchCreateStaff && (
                      <NavLink to="/admin/staff/new" className={subNavClass} title="Add New Account">
                        <FiUserPlus size={13} className={styles.subIcon} />
                        <span>Add New Account</span>
                      </NavLink>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Section: Reports & Analytics */}
          {canAccessReports && hasAnalyticsMatches && (
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
          {isAdmin && hasSystemMatches && (
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
          4. User Profile Footer (Exact 28px Alignment Axis)
          ========================================================================== */}
      {!isCollapsed ? (
        <div className={styles.sidebarFooter}>
          <div
            className={styles.userProfileCard}
            onClick={() => navigate('/admin/profile')}
            title="My Profile"
          >
            <div className={styles.avatarLeft}>
              <div className={styles.avatarBox}>{firstLetter}</div>
              <div className={styles.userMeta}>
                <span className={styles.userName}>{username || 'System Admin'}</span>
                <span className={styles.userRole}>{getProfileSubtitle()}</span>
              </div>
            </div>
            <span className={styles.onlineDot} title="Online" />
          </div>
        </div>
      ) : (
        <div className={styles.sidebarFooterCollapsed}>
          <div
            className={styles.avatarBoxCollapsed}
            onClick={() => navigate('/admin/profile')}
            title={`${username || 'Admin'} (${getProfileSubtitle()})`}
          >
            {firstLetter}
            <span className={styles.onlineDotCollapsed} />
          </div>
        </div>
      )}
    </aside>
  );
};
