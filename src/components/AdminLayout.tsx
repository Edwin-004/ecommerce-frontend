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
    /* Root Layout: flex h-screen w-screen overflow-hidden bg-slate-50/50 */
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50/50">
      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div
          className={styles.overlay}
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar: Fixed width / collapsible, independent internal scroll */}
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

      {/* Main Area Wrapper: flex-1 flex flex-col h-screen overflow-hidden min-w-0 */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0 bg-[#f8fafc]">
        {/* Top Header Component: h-14 bg-white border-b border-slate-100 px-6 flex items-center justify-between sticky top-0 z-30 */}
        <header className="h-14 bg-white border-b border-slate-100 px-6 flex items-center justify-between sticky top-0 z-30 flex-shrink-0">
          <Topbar
            onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
            isMobileMenuOpen={mobileMenuOpen}
          />
        </header>

        {/* Page Content Scroll Container: flex-1 overflow-y-auto overflow-x-hidden p-6 */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
