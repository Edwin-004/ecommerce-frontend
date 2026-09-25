import { useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logout } from "../features/auth/authSlice";
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
} from "react-icons/fi";

export const Sidebar = () => {
  const [open, setOpen] = useState(true);
  const location = useLocation();

  // Dropdown expansion states
  const isCatalogActive =
    location.pathname.startsWith("/admin/products") ||
    location.pathname.startsWith("/admin/variants") ||
    location.pathname.startsWith("/admin/variations");

  const isInventoryActive = location.pathname.startsWith("/admin/inventory");

  const [catalogOpen, setCatalogOpen] = useState<boolean>(true);
  const [inventoryOpen, setInventoryOpen] = useState<boolean>(true);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const navClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? `${styles.link} ${styles.active}` : styles.link;

  const subNavClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? `${styles.subLink} ${styles.subActive}` : styles.subLink;

  return (
    <aside className={`${styles.sidebar} ${!open ? styles.close : ""}`}>
      <div className={styles.header}>
        {open && <h2>E-Shop Admin</h2>}

        <button onClick={() => setOpen(!open)}>
          {open ? <FiChevronLeft /> : <FiMenu />}
        </button>
      </div>

      <nav>
        <NavLink to="/admin/dashboard" className={navClass}>
          <FiHome />
          {open && "Dashboard"}
        </NavLink>

        {open && <div className={styles.navSectionTitle}>Catalog & Stock</div>}

        {/* 1. Catalog Dropdown */}
        <div>
          <button
            type="button"
            className={`${styles.dropdownToggle} ${isCatalogActive ? styles.parentActive : ""}`}
            onClick={() => {
              if (!open) setOpen(true);
              setCatalogOpen(!catalogOpen);
            }}
          >
            <div className={styles.dropdownLeft}>
              <FiPackage />
              {open && "Product Catalog"}
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
                <FiPackage size={14} />
                Product Management
              </NavLink>
              <NavLink to="/admin/products/new" className={subNavClass}>
                <FiPlusCircle size={14} />
                Create Product
              </NavLink>
              <NavLink to="/admin/variants" className={subNavClass}>
                <FiLayers size={14} />
                Variants & SKUs
              </NavLink>
              <NavLink to="/admin/variations" className={subNavClass}>
                <FiSliders size={14} />
                Variations & Options
              </NavLink>
            </div>
          )}
        </div>

        {/* 2. Inventory Dropdown */}
        <div>
          <button
            type="button"
            className={`${styles.dropdownToggle} ${isInventoryActive ? styles.parentActive : ""}`}
            onClick={() => {
              if (!open) setOpen(true);
              setInventoryOpen(!inventoryOpen);
            }}
          >
            <div className={styles.dropdownLeft}>
              <FiBox />
              {open && "Inventory"}
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
                <FiBox size={14} />
                Stock Management
              </NavLink>
              <NavLink to="/admin/inventory?tab=low-stock" className={subNavClass}>
                <FiAlertTriangle size={14} />
                Low Stock Alerts
              </NavLink>
            </div>
          )}
        </div>

        {open && <div className={styles.navSectionTitle}>Operations</div>}

        {/* Orders */}
        <NavLink to="/admin/orders" className={navClass}>
          <FiShoppingCart />
          {open && "Orders"}
        </NavLink>

        <NavLink to="/admin/products" className={navClass}>
          <FiPackage />
          {open && "Products"}
        </NavLink>

        <NavLink to="/admin/inventory" className={navClass}>
          <FiBox />
          {open && "Inventory"}
        </NavLink>

        <NavLink to="/admin/staff" className={navClass}>
          <FiUsers />
          {open && "Staff"}
        </NavLink>

        {/* Reports */}
        <NavLink to="/admin/reports" className={navClass}>
          <FiBarChart2 />
          {open && "Reports"}
        </NavLink>
      </nav>

      {/* Logout Button */}
      <button className={styles.logout} onClick={handleLogout}>
        <FiLogOut />
        {open && "Logout"}
      </button>
    </aside>
  );
};