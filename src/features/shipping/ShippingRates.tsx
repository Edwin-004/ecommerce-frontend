import { useState } from 'react';
import { useGetZoneGroupsQuery } from './shippingApi';
import styles from './ShippingRates.module.css';
import {
  FiTruck,
  FiPlus,
  FiEdit2,
  FiSliders,
  FiCheckCircle,
  FiXCircle,
} from 'react-icons/fi';
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
        <div className={styles.titleArea}>
          <h1>
            <FiTruck /> Delivery Zones & Rates
          </h1>
          <p>Configure regional delivery zones, shipping fees, and estimated transit times</p>
        </div>

        <button
          type="button"
          className="btn-primary"
          onClick={() => setIsModalOpen(true)}
        >
          <FiPlus size={16} /> Add New Zone
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
                  <strong>"Add New Zone"</strong> to create one.
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
