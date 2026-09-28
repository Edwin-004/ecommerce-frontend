import { FiBell, FiSearch } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { type RootState } from "../store";
import styles from "./Topbar.module.css";

export const Topbar = () => {
  const navigate = useNavigate();
  
  // Redux မှ လက်ရှိ Login ဝင်ထားသူ၏ နာမည်နှင့် ရာထူးကို ဆွဲယူခြင်း
  const { username, role } = useSelector((state: RootState) => state.auth);

  // Role ကို ဖတ်ရလွယ်အောင် ပြောင်းပေးမည့် Function
  const formatRole = (roleStr: string | null) => {
    if (roleStr === 'ADMIN') return 'Administrator';
    if (roleStr === 'INVENTORY_STAFF') return 'Inventory Staff';
    if (roleStr === 'SALES_STAFF') return 'Sales Staff';
    return roleStr || 'System User';
  };

  // နာမည်ရဲ့ ပထမဆုံး စာလုံးကို ယူပြီး Avatar အဝိုင်းလေးထဲတွင် ပြရန် (မရှိလျှင် 'U' ဟုပြမည်)
  const firstLetter = username ? username.charAt(0).toUpperCase() : 'U';

  return (
    <header className={styles.topbar}>

      <div className={styles.search}>
        <FiSearch />
        <input placeholder="Search orders, products..." />
      </div>

      <div className={styles.right}>
        <button className={styles.iconBtn}>
          <FiBell size={20}/>
        </button>

        {/* ဤနေရာတွင် onClick နှင့် cursor: pointer ကို ထည့်သွင်းထားပါသည် */}
        <div 
          className={styles.profile} 
          onClick={() => navigate('/admin/profile')}
          style={{ cursor: 'pointer' }}
          title="Go to My Profile"
        >
          <div className={styles.avatar}>{firstLetter}</div>

          <div>
            {/* Redux မှ ရလာသော နာမည်နှင့် ရာထူးကို Dynamic အစားထိုးခြင်း */}
            <h4>{username || 'Admin'}</h4>
            <p>{formatRole(role)}</p>
          </div>
        </div>
      </div>

    </header>
  );
};