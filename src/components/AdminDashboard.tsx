import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { type RootState } from "../store";
import styles from "./AdminDashboard.module.css";
import { FiShoppingCart, FiDollarSign, FiPackage, FiUsers } from "react-icons/fi";
import { inventoryApi } from "../features/inventory/inventoryApi";
import { useGetOrdersQuery } from "../features/orders/orderApi";
import api from "../utils/axiosConfig";

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const [lowStockCount, setLowStockCount] = useState<number>(0);
  const [staffCount, setStaffCount] = useState<number>(0);

  const { username, role } = useSelector((state: RootState) => state.auth);

  // Real-time Orders & Revenue from Backend
  const { data: orders = [] } = useGetOrdersQuery();

  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((acc, order) => {
    return acc + (Number(order.totalAmount) || 0);
  }, 0);

  const formatRole = (roleStr: string | null) => {
    if (roleStr === 'BUSINESS_OWNER' || roleStr === 'OWNER') return 'Business Owner';
    if (roleStr === 'ADMIN') return 'System Admin';
    if (roleStr === 'INVENTORY_STAFF') return 'Inventory Staff';
    if (roleStr === 'SALES_STAFF') return 'Sales Staff';
    return roleStr || '';
  };

  useEffect(() => {
    // 1. Fetch Low Stock Alerts
    inventoryApi.getLowStockAlerts()
      .then((data) => setLowStockCount(data.length))
      .catch(() => setLowStockCount(0));

    // 2. Fetch Staff Count
    api.get('/staff')
      .then((res) => {
        if (Array.isArray(res.data)) {
          setStaffCount(res.data.length);
        }
      })
      .catch(() => setStaffCount(0));
  }, []);

  return (
    <div>
      <h1>Dashboard</h1>
      <p className={styles.subtitle}>
        Welcome back, <strong>{username || 'Admin'}</strong>{' '}
        <span style={{ fontSize: '14px', color: '#6b7280' }}>({formatRole(role)})</span>
      </p>

      <div className={styles.grid}>
        {/* Total Orders Card */}
        <div
          className={styles.card}
          style={{ cursor: "pointer", transition: "transform 0.2s" }}
          onClick={() => navigate("/admin/orders")}
          title="Click to view all orders"
        >
          <FiShoppingCart className={styles.blue} />
          <h2>{totalOrders.toLocaleString()}</h2>
          <p>Total Orders (View All &rarr;)</p>
        </div>

        {/* Total Revenue Card */}
        <div
          className={styles.card}
          style={{ transition: "transform 0.2s" }}
          title="Total orders revenue"
        >
          <FiDollarSign className={styles.green} />
          <h2>${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
          <p>Total Revenue</p>
        </div>

        {/* Low Stock Card */}
        <div
          className={styles.card}
          style={{ cursor: "pointer", transition: "transform 0.2s" }}
          onClick={() => navigate("/admin/inventory")}
          title="Click to view low stock items"
        >
          <FiPackage className={styles.orange} />
          <h2>{lowStockCount}</h2>
          <p>Low Stock (View All &rarr;)</p>
        </div>

        {/* Staff Members Card */}
        <div
          className={styles.card}
          style={{ cursor: "pointer", transition: "transform 0.2s" }}
          onClick={() => navigate("/admin/staff")}
          title="Click to view staff team"
        >
          <FiUsers className={styles.purple} />
          <h2>{staffCount}</h2>
          <p>Staff (View All &rarr;)</p>
        </div>
      </div>
    </div>
  );
};