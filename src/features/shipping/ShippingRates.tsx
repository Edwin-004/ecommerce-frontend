import type { DeliveryZone } from '../../types/shipping';
import styles from './ShippingRates.module.css';

export const ShippingRates = () => {
  // UI ကို အရင်မြင်ရအောင် တည်ဆောက်ထားသော အစမ်း Data (Mock Data)
  const mockZones: DeliveryZone[] = [
    {
      zoneId: 1,
      zoneName: 'Yangon Downtown',
      regionOrState: 'Yangon',
      township: 'Latha, Pabedan, Kyauktada',
      currentFee: 2000,
      estimatedDays: '1-2 Days',
      status: 'ACTIVE',
    },
    {
      zoneId: 2,
      zoneName: 'Yangon Suburbs',
      regionOrState: 'Yangon',
      township: 'Insein, Hlaing Tharyar',
      currentFee: 3000,
      estimatedDays: '1-3 Days',
      status: 'ACTIVE',
    },
    {
      zoneId: 3,
      zoneName: 'Mandalay City',
      regionOrState: 'Mandalay',
      township: 'Chanayethazan, Maha Aungmye',
      currentFee: 3500,
      estimatedDays: '2-4 Days',
      status: 'ACTIVE',
    },
  ];

  return (
    <div className={styles.container}>
      {/* Header Section */}
      <div className={styles.header}>
        <h2 className={styles.pageTitle}>Delivery Zones & Rates</h2>
        <button className={styles.addBtn}>+ Add New Zone</button>
      </div>

      {/* Table Section */}
      <div className={styles.tableContainer}>
        <table className={styles.zoneTable}>
          <thead>
            <tr>
              <th>Zone Name</th>
              <th>Region / State</th>
              <th>Townships</th>
              <th>Current Fee</th>
              <th>Est. Days</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {mockZones.map((zone) => (
              <tr key={zone.zoneId}>
                <td style={{ fontWeight: 500 }}>{zone.zoneName}</td>
                <td>{zone.regionOrState}</td>
                <td style={{ color: '#64748b' }}>{zone.township}</td>
                <td style={{ fontWeight: 600, color: '#0f172a' }}>
                  {zone.currentFee.toLocaleString()} Ks
                </td>
                <td>{zone.estimatedDays}</td>
                <td>
                  <span
                    className={`${styles.badge} ${
                      zone.status === 'ACTIVE'
                        ? styles.badgeActive
                        : styles.badgeInactive
                    }`}
                  >
                    {zone.status}
                  </span>
                </td>
                <td>
                  <div className={styles.actionGroup}>
                    <button className={styles.editBtn}>Edit Zone</button>
                    <button className={styles.manageBtn}>Manage Rates</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
