import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import styles from "./AdminLayout.module.css";

export const AdminLayout = () => {
  return (
    <div className={styles.layout}>
      <Sidebar />

      <div className={styles.main}>
        <Topbar />

        <div className={styles.content}>
          <Outlet />
        </div>
      </div>
    </div>
  );
};