import { FiBell, FiSearch } from "react-icons/fi";
import styles from "./Topbar.module.css";

export const Topbar = () => {
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

        <div className={styles.profile}>
          <div className={styles.avatar}>A</div>

          <div>
            <h4>Admin</h4>
            <p>Administrator</p>
          </div>
        </div>
      </div>

    </header>
  );
};