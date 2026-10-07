import { useState, useRef, useEffect } from "react";
import {
  FiBell,
  FiSearch,
  FiChevronDown,
  FiUser,
  FiLogOut,
  FiShield,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../features/auth/authSlice";
import { type RootState } from "../store";
import styles from "./Topbar.module.css";

export const Topbar = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Redux auth state
  const { username, email, role } = useSelector((state: RootState) => state.auth);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatRole = (roleStr: string | null) => {
    if (roleStr === "BUSINESS_OWNER" || roleStr === "OWNER")
      return "Business Owner";
    if (roleStr === "ADMIN") return "System Admin";
    if (roleStr === "INVENTORY_STAFF") return "Inventory Staff";
    if (roleStr === "SALES_STAFF") return "Sales Staff";
    return roleStr || "Staff";
  };

  const firstLetter = username ? username.charAt(0).toUpperCase() : "A";

  const handleSignOut = () => {
    setDropdownOpen(false);
    dispatch(logout());
    navigate("/login");
  };

  const handleProfileSettings = () => {
    setDropdownOpen(false);
    navigate("/admin/profile");
  };

  return (
    <header className={styles.topbar}>
      {/* Search Input Bar (Shodai-inspired) */}
      <div className={styles.search}>
        <FiSearch className={styles.searchIcon} />
        <input
          type="text"
          placeholder="Search products, orders, categories..."
          aria-label="Search"
        />
        <span className={styles.searchShortcut}>⌘ K</span>
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

        {/* Profile Avatar Trigger + Dropdown */}
        <div className={styles.profileContainer} ref={dropdownRef}>
          <button
            type="button"
            className={styles.profileTrigger}
            onClick={() => setDropdownOpen((prev) => !prev)}
            aria-expanded={dropdownOpen}
            aria-haspopup="true"
          >
            <div className={styles.avatar}>{firstLetter}</div>

            <div className={styles.profileInfo}>
              <span className={styles.profileName}>{username || "Admin"}</span>
              <span className={styles.profileRole}>{formatRole(role)}</span>
            </div>

            <FiChevronDown
              className={`${styles.chevron} ${
                dropdownOpen ? styles.chevronRotated : ""
              }`}
            />
          </button>

          {/* Floating Dropdown Menu */}
          {dropdownOpen && (
            <div className={styles.dropdownMenu}>
              {/* User Header */}
              <div className={styles.dropdownHeader}>
                <div className={styles.dropdownAvatar}>{firstLetter}</div>
                <div className={styles.dropdownUserMeta}>
                  <p className={styles.dropdownUserName}>
                    {username || "Administrator"}
                  </p>
                  <p className={styles.dropdownUserEmail}>
                    {email || "admin@ecommerce.com"}
                  </p>
                  <span className={styles.roleBadge}>
                    <FiShield size={11} />
                    {formatRole(role)}
                  </span>
                </div>
              </div>

              <div className={styles.dropdownDivider} />

              {/* Profile Settings Option */}
              <button
                type="button"
                className={styles.dropdownItem}
                onClick={handleProfileSettings}
              >
                <div className={styles.itemIconWrapper}>
                  <FiUser size={16} />
                </div>
                <span>Profile Settings</span>
              </button>

              <div className={styles.dropdownDivider} />

              {/* Sign Out Option */}
              <button
                type="button"
                className={`${styles.dropdownItem} ${styles.logoutItem}`}
                onClick={handleSignOut}
              >
                <div className={`${styles.itemIconWrapper} ${styles.logoutIcon}`}>
                  <FiLogOut size={16} />
                </div>
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};