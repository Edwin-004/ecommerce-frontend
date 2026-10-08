import { FiBell, FiSearch } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { type RootState } from "../store";
import styles from "./Topbar.module.css";

export const Topbar = () => {
  const navigate = useNavigate();
  
  // Redux မှ လက်ရှိ Login ဝင်ထားသူ၏ နာမည်နှင့် ရာထူးကို ဆွဲယူခြင်း
  const { username, role } = useSelector((state: RootState) => state.auth);

  // Role ကို အပြည့်အစုံဖော်ပြပေးမည့် Function
  const formatRole = (roleStr: string | null) => {
    if (roleStr === 'ADMIN') return 'Administrator';
    if (roleStr === 'INVENTORY_STAFF') return 'Inventory Staff';
    if (roleStr === 'SALES_STAFF') return 'Sales Staff';
    return roleStr || 'System User';
  };

  // ပရိုဖိုင်ပုံစံ Avatar အတွက် နာမည်၏ ပထမဆုံးစာလုံးကို ယူခြင်း (မရှိလျှင် 'U' ဖြစ်မည်)
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