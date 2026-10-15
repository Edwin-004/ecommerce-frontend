import { FiBell, FiMenu } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { type RootState } from "../store";
import styles from "./Topbar.module.css";

interface TopbarProps {
  onToggleMobileMenu?: () => void;
  isMobileMenuOpen?: boolean;
}

export const Topbar = ({ onToggleMobileMenu }: TopbarProps) => {
  const navigate = useNavigate();

  // Redux auth state
  const { username, role } = useSelector((state: RootState) => state.auth);

  // Role formatter
  const formatRole = (roleStr: string | null) => {
    if (roleStr === "BUSINESS_OWNER" || roleStr === "OWNER")
      return "Business Owner";
    if (roleStr === "ADMIN") return "System Admin";
    if (roleStr === "INVENTORY_STAFF") return "Inventory Staff";
    if (roleStr === "SALES_STAFF") return "Sales Staff";
    return roleStr || "Staff";
  };

  const firstLetter = username ? username.charAt(0).toUpperCase() : 'U';

  return (
    <header className={styles.topbar}>
      <div className={styles.left}>
        {onToggleMobileMenu && (
          <button
            type="button"
            className={styles.menuBtn}
            onClick={onToggleMobileMenu}
            aria-label="Toggle navigation menu"
            title="Toggle Menu"
          >
            <FiMenu size={22} />
          </button>
        )}
      </div>

      {/* Header Right Actions */}
      <div className={styles.right}>
        {/* Notification Bell */}
        <button
          type="button"
          className={styles.iconBtn}
          title="Notifications"
          aria-label="Notifications"
        >
          <FiBell size={19} />
          <span className={styles.notificationDot} />
        </button>

        {/* Profile Card */}
        <div 
          className={styles.profileTrigger} 
          onClick={() => navigate('/admin/profile')}
          title="Go to My Profile"
        >
          <div className={styles.avatar}>{firstLetter}</div>

          <div className={styles.profileInfo}>
            <span className={styles.profileName}>{username || 'Admin'}</span>
            <span className={styles.profileRole}>{formatRole(role)}</span>
          </div>
        </div>
      </div>
    </header>
  );
};