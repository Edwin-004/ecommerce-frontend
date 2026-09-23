import { NavLink, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logout } from "../features/auth/authSlice";
import styles from "./Sidebar.module.css";
import { useState } from "react";

import {
  FiMenu,
  FiChevronLeft,
  FiHome,
  FiShoppingCart,
  FiPackage,
  FiBox,
  FiUsers,
  FiBarChart2,
  FiLogOut,
} from "react-icons/fi";

export const Sidebar = () => {
  const [open, setOpen] = useState(true);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const navClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? `${styles.link} ${styles.active}` : styles.link;

  return (
    <aside className={`${styles.sidebar} ${!open ? styles.close : ""}`}>
      <div className={styles.header}>
        {open && <h2>E-Shop</h2>}

        <button onClick={() => setOpen(!open)}>
          {open ? <FiChevronLeft /> : <FiMenu />}
        </button>
      </div>

      <nav>
        <NavLink to="/admin/dashboard" className={navClass}>
          <FiHome />
          {open && "Dashboard"}
        </NavLink>

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

        <NavLink to="/admin/reports" className={navClass}>
          <FiBarChart2 />
          {open && "Reports"}
        </NavLink>
      </nav>

      <button className={styles.logout} onClick={handleLogout}>
        <FiLogOut />
        {open && "Logout"}
      </button>
    </aside>
  );
};