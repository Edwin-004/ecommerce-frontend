import { useState } from 'react';
import { useGetZoneGroupsQuery } from './shippingApi';
import styles from './ShippingRates.module.css';
import { AddNewZoneModal } from './AddNewZoneModal';

export const ShippingRates = () => {
  const {
    data: zoneGroups = [],
    isLoading,
    isError,
    refetch,
  } = useGetZoneGroupsQuery();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className={styles.container}>
      {/* Header Section */}
      <div className={styles.header}>
        <h2 className={styles.pageTitle}>Delivery Zones & Rates</h2>
        <button onClick={() => setIsModalOpen(true)} className={styles.addBtn}>
          Create New Zone
        </button>
      </div>

      {/* API Error တက်ခဲ့လျှင် ပြသမည့် အပိုင်း */}
      {isError && (
        <div className={styles.errorBanner}>
          <span>
            Failed to load delivery zones. Please check your connection.
          </span>
          <button onClick={() => refetch()} className={styles.retryBtn}>
            Retry
          </button>
        </div>
      )}

      {/* Table Section */}
      <div className={styles.tableContainer}>
        <table className={styles.zoneTable}>
          <thead>
            <tr>
              <th>Zone Name</th>
              <th>Region / City</th>
              <th>Townships</th>
              <th>Current Fee</th>
              <th>Est. Days</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className={styles.stateCell}>
                  Loading delivery zones...
                </td>
              </tr>
            ) : zoneGroups.length === 0 ? (
              <tr>
                <td colSpan={7} className={styles.stateCell}>
                  No delivery zones found. Click{' '}
                  <strong>"Create New Zone"</strong> to create one.
                </td>
              </tr>
            ) : (
              zoneGroups.map((zone) => (
                <tr key={`${zone.zoneName}_${zone.city}`}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{zone.zoneName}</div>
                    <div className={styles.subText}>{zone.zoneCode}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{zone.city}</div>
                    <div className={styles.subText}>{zone.regionOrState}</div>
                  </td>
                  <td>
                    {zone.isCityDefault ? (
                      <span className={styles.defaultTownshipBadge}>
                        All Other Townships (City Default)
                      </span>
                    ) : (
                      <div className={styles.townshipList}>
                        {zone.townships.map((t) => (
                          <span key={t} className={styles.townshipTag}>
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td style={{ fontWeight: 600, color: '#0f172a' }}>
                    {(zone.shippingFee ?? 0).toLocaleString()} Ks
                  </td>
                  <td>
                    {zone.estimatedDays ? `${zone.estimatedDays} Days` : '-'}
                  </td>
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
              ))
            )}
          </tbody>
        </table>
        <AddNewZoneModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      </div>
    </div>
  );
};
