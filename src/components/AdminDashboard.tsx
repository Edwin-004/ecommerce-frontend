import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom"; // <--- Link ကိုပါ ထည့်ခေါ်ပါ
import { useSelector } from "react-redux";
import { type RootState } from "../store";
import styles from "./AdminDashboard.module.css";
import { FiShoppingCart, FiDollarSign, FiPackage, FiUsers } from "react-icons/fi";
import { inventoryApi } from "../features/inventory/inventoryApi";

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const [lowStockCount, setLowStockCount] = useState<number | string>(0);
  
  const { username, role } = useSelector((state: RootState) => state.auth);

  const formatRole = (roleStr: string | null) => {
    if (roleStr === 'ADMIN') return 'System Admin';
    if (roleStr === 'INVENTORY_STAFF') return 'Inventory Staff';
    if (roleStr === 'SALES_STAFF') return 'Sales Staff';
    return roleStr || '';
  };

  useEffect(() => {
    inventoryApi.getLowStockAlerts()
      .then((data) => setLowStockCount(data.length))
      .catch(() => setLowStockCount(0));
  }, []);

  return (
    <div>

      <h1>Dashboard</h1>
      <p className={styles.subtitle}>
        Welcome back,{' '}
        
        
        <span style={{ fontSize: '14px', color: '#6b7280' }}>({formatRole(role)})</span>
      </p>

      <div className={styles.grid}>
        <div className={styles.card}>
          <FiShoppingCart className={styles.blue}/>
          <h2>1,248</h2>
          <p>Total Orders</p>
        </div>

        <div className={styles.card}>
          <FiDollarSign className={styles.green}/>
          <h2>$28,430</h2>
          <p>Revenue</p>
        </div>

        <div
          className={styles.card}
          style={{ cursor: "pointer", transition: "transform 0.2s" }}
          onClick={() => navigate("/admin/inventory")}
          title="Click to view Low Stock items"
        >
          <FiPackage className={styles.orange}/>
          <h2>{lowStockCount}</h2>
          <p>Low Stock (View All &rarr;)</p>
        </div>

        <div className={styles.card}>
          <FiUsers className={styles.purple}/>
          <h2>12</h2>
          <p>Staff</p>
        </div>
      </div>

    </div>
  );
};