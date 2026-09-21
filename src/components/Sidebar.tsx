import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logout } from '../features/auth/authSlice';
import styles from './Sidebar.module.css';
import { useState } from 'react';
import {
  FiMenu,
  FiChevronLeft,
  FiHome,
  FiBox,
  FiList,
  FiShoppingCart,
  FiLogOut,
} from 'react-icons/fi';

export const Sidebar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isOrderMenuOpen, setIsOrderMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const getNavLinkClass = ({ isActive }: { isActive: boolean }) => {
    return isActive ? `${styles.navLink} ${styles.activeLink}` : styles.navLink;
  };

  return (
    <div
      className={`${styles.sidebarContainer} ${isSidebarOpen ? styles.sidebarOpen : styles.sidebarClosed}`}
    >
      <div className={styles.sidebarHeader}>
        <h2 className={styles.menuTitle}>
          {isSidebarOpen ? 'Admin Panel' : 'AP'}
        </h2>

        <button
          className={styles.toggleBtn}
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          {isSidebarOpen ? <FiChevronLeft /> : <FiMenu />}
        </button>
      </div>
      <nav className={styles.navContainer}>
        <NavLink
          to="/admin/dashboard"
          className={getNavLinkClass}
          title="Order Management"
        >
          <FiHome size={20} />
          {isSidebarOpen && <span>Dashboard</span>}
        </NavLink>

        <div
          className={styles.dropdownHeader}
          onClick={() => setIsOrderMenuOpen(!isOrderMenuOpen)}
          title="Order Management"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <FiShoppingCart size={20} />
            {isSidebarOpen && <span>Order Management</span>}
          </div>
          {isSidebarOpen && <span>{isOrderMenuOpen ? '▼' : '▶'}</span>}
        </div>

        {isOrderMenuOpen && (
          <div className={styles.dropdownContent}>
            <NavLink to="/admin/orders" className={getNavLinkClass}>
              <FiBox size={20} />
              {isSidebarOpen && <span>All Orders</span>}
            </NavLink>

            <NavLink to="/admin/orders/pending" className={getNavLinkClass}>
              <FiList size={20} />
              {isSidebarOpen && <span>Pending Orders</span>}
            </NavLink>
          </div>
        )}
      </nav>
      <button className={styles.logoutBtn} onClick={handleLogout}>
        {isSidebarOpen && <span>Logout</span>}
        <FiLogOut size={20} />
      </button>
    </div>
  );
};
