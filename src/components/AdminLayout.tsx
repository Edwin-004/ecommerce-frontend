import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import styles from "./AdminLayout.module.css";

export const AdminLayout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem("admin_sidebar_collapsed") === "true";
  });

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("admin_sidebar_collapsed", String(next));
      return next;
    });
  };

  return (
    <div className={styles.layout}>
      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div
          className={styles.overlay}
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <div
        className={`${styles.sidebarWrapper} ${
          isSidebarCollapsed ? styles.sidebarWrapperCollapsed : ""
        } ${mobileMenuOpen ? styles.sidebarOpen : ""}`}
      >
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={toggleSidebarCollapse}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />
      </div>

      <div
        className={`${styles.main} ${
          isSidebarCollapsed ? styles.mainCollapsed : ""
        }`}
      >
        <Topbar
          onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
          isMobileMenuOpen={mobileMenuOpen}
        />

        <div className={styles.content}>
          <Outlet />
        </div>
      </div>
    </div>
  );
};
