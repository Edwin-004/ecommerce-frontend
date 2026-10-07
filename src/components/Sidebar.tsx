import { useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../features/auth/authSlice";
import { type RootState } from "../store";
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
  FiBarChart2,
  FiLogOut,
  FiLayers,
  FiSliders,
  FiAlertTriangle,
  FiPlusCircle,
  FiFolder,
  FiGrid,
  FiTag,
} from "react-icons/fi";

export const Sidebar = () => {
  const [open, setOpen] = useState(true);
  const location = useLocation();

  // Dropdown expansion states
 
  const isCatalogActive =
  location.pathname.startsWith("/admin/products") ||
  location.pathname.startsWith("/admin/variants") ||
  location.pathname.startsWith("/admin/variations") ||
  location.pathname.startsWith("/admin/categories") ||
  location.pathname.startsWith("/admin/brands") ||
  location.pathname.startsWith("/admin/tags");

  const isInventoryActive = location.pathname.startsWith("/admin/inventory");

  const [catalogOpen, setCatalogOpen] = useState<boolean>(true);
  const [inventoryOpen, setInventoryOpen] = useState<boolean>(true);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { username, role } = useSelector((state: RootState) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const navClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? `${styles.link} ${styles.active}` : styles.link;

  const subNavClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? `${styles.subLink} ${styles.subActive}` : styles.subLink;

  const formatRole = (r: string | null) => {
    if (r === 'ADMIN') return 'Administrator';
    if (r === 'INVENTORY_STAFF') return 'Inventory Staff';
    if (r === 'SALES_STAFF') return 'Sales Staff';
    return r || 'Staff';
  };

  return (
    <aside className={`${styles.sidebar} ${!open ? styles.close : ""}`}>
      {/* Brand Header */}
      <div className={styles.header}>
        <div className={styles.brandContainer}>
          <div className={styles.logoBadge}>
            <FiGrid size={20} />
          </div>
          {open && (
            <div className={styles.brandText}>
              <h2>ECOMMERCE</h2>
              <span>Back-Office Portal</span>
            </div>
          )}
        </div>

        <button 
          className={styles.toggleBtn}
          onClick={() => setOpen(!open)}
          title={open ? "Collapse sidebar" : "Expand sidebar"}
        >
          {open ? <FiChevronLeft /> : <FiMenu />}
        </button>
      </div>

      {/* Navigation */}
      <nav className={styles.navContainer}>
        {open && <div className={styles.navSectionTitle}>Overview</div>}
        <NavLink to="/admin/dashboard" className={navClass}>
          <FiHome className={styles.linkIcon} />
          {open && <span>Dashboard</span>}
        </NavLink>

        {open && <div className={styles.navSectionTitle}>Catalog & Stock</div>}

        {/* 1. Catalog Dropdown */}
        <div className={styles.dropdownGroup}>
          <button
            type="button"
            className={`${styles.dropdownToggle} ${isCatalogActive ? styles.parentActive : ""}`}
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
                className={`${styles.chevron} ${catalogOpen ? styles.chevronRotated : ""}`}
              />
            )}
          </button>

          {open && catalogOpen && (
            <div className={styles.submenu}>
              <NavLink to="/admin/products" end className={subNavClass}>
                <FiPackage size={13} />
                <span>Product List</span>
              </NavLink>
              <NavLink to="/admin/products/new" className={subNavClass}>
                <FiPlusCircle size={13} />
                <span>Create Product</span>
              </NavLink>
              <NavLink to="/admin/categories" className={subNavClass}>
                <FiFolder size={13} />
                <span>Categories</span>
              </NavLink>
                <NavLink
                to="/admin/brands"
                className={subNavClass}
              >
                <FiTag size={13} />

                <span>
                  Brands
                </span>
              </NavLink>

              {/* Tags */} 
              <NavLink to="/admin/tags" className={subNavClass} > <FiTag size={13} /> 
              <span>Tags</span> </NavLink>
              <NavLink to="/admin/variants" className={subNavClass}>
                <FiLayers size={13} />
                
                <span>Variants & SKUs</span>
              </NavLink>
              <NavLink to="/admin/variations" className={subNavClass}>
                <FiSliders size={13} />
                <span>Variations & Options</span>
              </NavLink>
            </div>
          )}
        </div>

        {/* 2. Inventory Dropdown */}
        <div className={styles.dropdownGroup}>
          <button
            type="button"
            className={`${styles.dropdownToggle} ${isInventoryActive ? styles.parentActive : ""}`}
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
                className={`${styles.chevron} ${inventoryOpen ? styles.chevronRotated : ""}`}
              />
            )}
          </button>

          {open && inventoryOpen && (
            <div className={styles.submenu}>
              <NavLink to="/admin/inventory" className={subNavClass}>
                <FiBox size={13} />
                <span>Stock Management</span>
              </NavLink>
              <NavLink to="/admin/inventory?tab=low-stock" className={subNavClass}>
                <FiAlertTriangle size={13} />
                <span>Low Stock Alerts</span>
              </NavLink>
            </div>
          )}
        </div>

        {open && <div className={styles.navSectionTitle}>Operations</div>}

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

        {/* Reports */}
        <NavLink to="/admin/reports" className={navClass}>
          <FiBarChart2 className={styles.linkIcon} />
          {open && <span>Reports & Analytics</span>}
        </NavLink>
      </nav>

      {/* Footer Profile & Logout */}
      <div className={styles.footer}>
        {open && (
          <div className={styles.userCard} onClick={() => navigate('/admin/profile')}>
            <div className={styles.userAvatar}>
              {(username || 'A').charAt(0).toUpperCase()}
              <span className={styles.onlineDot}></span>
            </div>
            <div className={styles.userInfo}>
              <span className={styles.userName}>{username || 'Administrator'}</span>
              <span className={styles.userRole}>{formatRole(role)}</span>
            </div>
          </div>
        )}

        <button 
          className={styles.logoutBtn} 
          onClick={handleLogout}
          title="Sign out of account"
        >
          <FiLogOut className={styles.logoutIcon} />
          {open && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
};