import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import styles from "./Sidebar.module.css";

import {
  FiMenu,
  FiChevronLeft,
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
} from "react-icons/fi";

export const Sidebar = () => {
  const [open, setOpen] = useState(true);
  const location = useLocation();

  // Active check for Catalog items
  const isCatalogActive =
    location.pathname.startsWith("/admin/products") ||
    location.pathname.startsWith("/admin/categories") ||
    location.pathname.startsWith("/admin/brands") ||
    location.pathname.startsWith("/admin/tags") ||
    location.pathname.startsWith("/admin/variants") ||
    location.pathname.startsWith("/admin/variations");

  const isInventoryActive = location.pathname.startsWith("/admin/inventory");

  // Keep Catalog expanded by default or when an active child is selected
  const [catalogOpen, setCatalogOpen] = useState<boolean>(true);
  const [inventoryOpen, setInventoryOpen] = useState<boolean>(true);

  const navClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? `${styles.link} ${styles.active}` : styles.link;

  const subNavClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? `${styles.subLink} ${styles.subActive}` : styles.subLink;

  return (
    <aside className={`${styles.sidebar} ${!open ? styles.close : ""}`}>
      {/* Brand Header */}
      <div className={styles.header}>
        <div className={styles.brandContainer}>
          <div className={styles.logoBadge}>
            <FiShoppingBag size={20} />
          </div>
          {open && (
            <div className={styles.brandText}>
              <h2>Ecommerce</h2>
              <span>Admin Portal</span>
            </div>
          )}
        </div>

        <button
          type="button"
          className={styles.toggleBtn}
          onClick={() => setOpen(!open)}
          title={open ? "Collapse sidebar" : "Expand sidebar"}
          aria-label="Toggle Sidebar"
        >
          {open ? <FiChevronLeft size={16} /> : <FiMenu size={16} />}
        </button>
      </div>

      {/* Navigation Sections */}
      <nav className={styles.navContainer}>
        {/* ================= 1. OVERVIEW ================= */}
        {open && <div className={styles.navSectionTitle}>OVERVIEW</div>}
        <NavLink to="/admin/dashboard" className={navClass}>
          <FiHome className={styles.linkIcon} />
          {open && <span>Dashboard</span>}
        </NavLink>

        {/* ================= 2. CATALOG & STOCK ================= */}
        {open && <div className={styles.navSectionTitle}>CATALOG & STOCK</div>}

        {/* Product Catalog Dropdown */}
        <div className={styles.dropdownGroup}>
          <button
            type="button"
            className={`${styles.dropdownToggle} ${
              isCatalogActive ? styles.parentActive : ""
            }`}
            onClick={() => {
              if (!open) setOpen(true);
              setCatalogOpen(!catalogOpen);
            }}
          >
            <div className={styles.dropdownLeft}>
              <FiPackage className={styles.linkIcon} />
              {open && <span>Product Catalog</span>}
            </div>
            {open && (
              <FiChevronDown
                className={`${styles.chevron} ${
                  catalogOpen ? styles.chevronRotated : ""
                }`}
              />
            )}
          </button>

          {open && catalogOpen && (
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
              isInventoryActive ? styles.parentActive : ""
            }`}
            onClick={() => {
              if (!open) setOpen(true);
              setInventoryOpen(!inventoryOpen);
            }}
          >
            <div className={styles.dropdownLeft}>
              <FiBox className={styles.linkIcon} />
              {open && <span>Inventory</span>}
            </div>
            {open && (
              <FiChevronDown
                className={`${styles.chevron} ${
                  inventoryOpen ? styles.chevronRotated : ""
                }`}
              />
            )}
          </button>

          {open && inventoryOpen && (
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
        {open && <div className={styles.navSectionTitle}>OPERATIONS</div>}

        {/* Orders */}
        <NavLink to="/admin/orders" className={navClass}>
          <FiShoppingCart className={styles.linkIcon} />
          {open && <span>Orders</span>}
        </NavLink>

        {/* Staff Management */}
        <NavLink to="/admin/staff" className={navClass}>
          <FiUsers className={styles.linkIcon} />
          {open && <span>Staff Management</span>}
        </NavLink>
      </nav>
    </aside>
  );
};