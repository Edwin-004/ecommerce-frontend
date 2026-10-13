import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import styles from './Sidebar.module.css';

import {
  FiChevronDown,
  FiHome,
  FiShoppingCart,
  FiPackage,
  FiBox,
  FiUsers,
  FiLayers,
  FiFolder,
  FiTag,
  FiGrid,
  FiShoppingBag,
  FiTruck,
  FiBarChart2,
} from 'react-icons/fi';

export const Sidebar = () => {
  const location = useLocation();

  // Active check for Catalog items
  const isCatalogActive =
    location.pathname.startsWith('/admin/products') ||
    location.pathname.startsWith('/admin/categories') ||
    location.pathname.startsWith('/admin/brands') ||
    location.pathname.startsWith('/admin/tags') ||
    location.pathname.startsWith('/admin/variants') ||
    location.pathname.startsWith('/admin/variations');

  const isInventoryActive = location.pathname.startsWith('/admin/inventory');

  // Keep Catalog expanded by default or when an active child is selected
  const [catalogOpen, setCatalogOpen] = useState<boolean>(true);
  const [inventoryOpen, setInventoryOpen] = useState<boolean>(true);

  const navClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? `${styles.link} ${styles.active}` : styles.link;

  const subNavClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? `${styles.subLink} ${styles.subActive}` : styles.subLink;

  return (
    <aside className={styles.sidebar}>
      {/* Brand Header */}
      <div className={styles.header}>
        <div className={styles.brandContainer}>
          <div className={styles.logoBadge}>
            <FiShoppingBag size={20} />
          </div>
          <div className={styles.brandText}>
            <h2>Ecommerce</h2>
            <span>Admin Portal</span>
          </div>
        </div>
      </div>

      {/* Navigation Sections */}
      <nav className={styles.navContainer}>
        {/* ================= 1. OVERVIEW ================= */}
        <div className={styles.navSectionTitle}>OVERVIEW</div>
        <NavLink to="/admin/dashboard" className={navClass}>
          <FiHome className={styles.linkIcon} />
          <span>Dashboard</span>
        </NavLink>

        {/* ================= 2. CATALOG & STOCK ================= */}
        <div className={styles.navSectionTitle}>CATALOG & STOCK</div>

        {/* Product Catalog Dropdown */}
        <div className={styles.dropdownGroup}>
          <button
            type="button"
            className={`${styles.dropdownToggle} ${
              isCatalogActive ? styles.parentActive : ''
            }`}
            onClick={() => setCatalogOpen(!catalogOpen)}
          >
            <div className={styles.dropdownLeft}>
              <FiPackage className={styles.linkIcon} />
              <span>Product Catalog</span>
            </div>
            <FiChevronDown
              className={`${styles.chevron} ${
                catalogOpen ? styles.chevronRotated : ""
              }`}
            />
          </button>

          {catalogOpen && (
            <div className={styles.submenu}>
              <NavLink to="/admin/products" end className={subNavClass}>
                <FiPackage size={14} className={styles.subIcon} />
                <span>Product List</span>
              </NavLink>

              <NavLink to="/admin/categories" className={subNavClass}>
                <FiFolder size={14} className={styles.subIcon} />
                <span>Categories</span>
              </NavLink>

              <NavLink to="/admin/brands" className={subNavClass}>
                <FiGrid size={14} className={styles.subIcon} />
                <span>Brands</span>
              </NavLink>

              <NavLink to="/admin/tags" className={subNavClass}>
                <FiTag size={14} className={styles.subIcon} />
                <span>Tags</span>
              </NavLink>

              <NavLink to="/admin/variants" className={subNavClass}>
                <FiLayers size={14} className={styles.subIcon} />
                <span>Variants & Options</span>
              </NavLink>
            </div>
          )}
        </div>

        {/* Stock Management (Inventory) */}
        <div className={styles.dropdownGroup}>
          <button
            type="button"
            className={`${styles.dropdownToggle} ${
              isInventoryActive ? styles.parentActive : ''
            }`}
            onClick={() => setInventoryOpen(!inventoryOpen)}
          >
            <div className={styles.dropdownLeft}>
              <FiBox className={styles.linkIcon} />
              <span>Inventory</span>
            </div>
            <FiChevronDown
              className={`${styles.chevron} ${
                inventoryOpen ? styles.chevronRotated : ""
              }`}
            />
          </button>

          {inventoryOpen && (
            <div className={styles.submenu}>
              <NavLink to="/admin/inventory" end className={subNavClass}>
                <FiBox size={14} className={styles.subIcon} />
                <span>Stock Management</span>
              </NavLink>
              <NavLink
                to="/admin/inventory?tab=low-stock"
                className={subNavClass}
              >
                <span className={styles.warningDot} />
                <span>Low Stock Alerts</span>
              </NavLink>
            </div>
          )}
        </div>

        {/* ================= 3. OPERATIONS ================= */}
        <div className={styles.navSectionTitle}>OPERATIONS</div>

        {/* Orders */}
        <NavLink to="/admin/orders" className={navClass}>
          <FiShoppingCart className={styles.linkIcon} />
          <span>Orders</span>
        </NavLink>

        {/* Shipping rate */}
        <NavLink to="/admin/shipping-rates" className={navClass}>
          <FiTruck className={styles.linkIcon} />
          <span>Shipping Rates</span>
        </NavLink>

        {/* Staff Management */}
        <NavLink to="/admin/staff" className={navClass}>
          <FiUsers className={styles.linkIcon} />
          <span>Staff Management</span>
        </NavLink>

        {/* Reports & Analytics */}
        <NavLink to="/admin/reports" className={navClass}>
          <FiBarChart2 className={styles.linkIcon} />
          <span>Reports & Analytics</span>
        </NavLink>
      </nav>
    </aside>
  );
};
