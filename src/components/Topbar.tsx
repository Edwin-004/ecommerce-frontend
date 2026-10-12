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

  // Role ကို အပြည့်အစုံဖော်ပြပေးမည့် Function
  const formatRole = (roleStr: string | null) => {
    if (roleStr === "BUSINESS_OWNER" || roleStr === "OWNER")
      return "Business Owner";
    if (roleStr === "ADMIN") return "System Admin";
    if (roleStr === "INVENTORY_STAFF") return "Inventory Staff";
    if (roleStr === "SALES_STAFF") return "Sales Staff";
    return roleStr || "Staff";
  };

  // ပရိုဖိုင်ပုံစံ Avatar အတွက် နာမည်၏ ပထမဆုံးစာလုံးကို ယူခြင်း (မရှိလျှင် 'U' ဖြစ်မည်)
  const firstLetter = username ? username.charAt(0).toUpperCase() : 'U';

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

        {/* နှိပ်လို့ရကြောင်းသိစေရန် onClick နှင့် cursor: pointer ထည့်ပေးထားပါသည် */}
        <div 
          className={styles.profile} 
          onClick={() => navigate('/admin/profile')}
          style={{ cursor: 'pointer' }}
          title="Go to My Profile"
        >
          <div className={styles.avatar}>{firstLetter}</div>

          <div>
            {/* Redux မှ ရရှိလာသော အချက်အလက်များကို ဤနေရာတွင် Dynamic ပြပေးထားပါသည် */}
            <h4>{username || 'Admin'}</h4>
            <p>{formatRole(role)}</p>
          </div>
        </div>
      </div>
    </header>
  );
};