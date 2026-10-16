import type { DeliveryZone } from '../../types/shipping';
import styles from './ShippingRates.module.css';
import {
  FiTruck,
  FiPlus,
  FiEdit2,
  FiSliders,
  FiCheckCircle,
  FiXCircle,
} from 'react-icons/fi';

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
        <div className={styles.titleArea}>
          <h1>
            <FiTruck /> Delivery Zones & Rates
          </h1>
          <p>Configure regional delivery zones, shipping fees, and estimated transit times</p>
        </div>

        <button type="button" className="btn-primary">
          <FiPlus size={16} /> Add New Zone
        </button>
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
                <td style={{ fontWeight: 600, color: '#0f172a' }}>
                  {zone.zoneName}
                </td>
                <td>{zone.regionOrState}</td>
                <td style={{ color: '#64748b' }}>{zone.township}</td>
                <td style={{ fontWeight: 600, color: '#0f172a' }}>
                  {zone.currentFee.toLocaleString()} Ks
                </td>
                <td style={{ color: '#475569' }}>{zone.estimatedDays}</td>
                <td>
                  <span
                    className={`badge-status ${
                      zone.status === 'ACTIVE'
                        ? 'badge-status-active'
                        : 'badge-status-inactive'
                    }`}
                  >
                    {zone.status === 'ACTIVE' ? (
                      <FiCheckCircle size={12} />
                    ) : (
                      <FiXCircle size={12} />
                    )}
                    {zone.status}
                  </span>
                </td>
                <td>
                  <div className={styles.actionGroup}>
                    <button
                      type="button"
                      className="table-btn-edit"
                      title="Edit Zone"
                    >
                      <FiEdit2 size={13} /> Edit Zone
                    </button>
                    <button
                      type="button"
                      className="table-btn-view"
                      title="Manage Rates"
                    >
                      <FiSliders size={13} /> Manage Rates
                    </button>
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
