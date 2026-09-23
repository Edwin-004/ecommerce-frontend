import styles from "./AdminDashboard.module.css";
import { FiShoppingCart, FiDollarSign, FiPackage, FiUsers } from "react-icons/fi";

export const AdminDashboard = () => {
  return (
    <div>

      <h1>Dashboard</h1>
      <p className={styles.subtitle}>
        Welcome back, Admin
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

        <div className={styles.card}>
          <FiPackage className={styles.orange}/>
          <h2>23</h2>
          <p>Low Stock</p>
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