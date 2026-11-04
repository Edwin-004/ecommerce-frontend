import { useMemo, useState } from 'react';
import { useGetZoneGroupsQuery } from './shippingApi';
import styles from './ShippingRates.module.css';
import {
  FiPlus,
  FiEdit2,
  FiCheckCircle,
  FiXCircle,
} from 'react-icons/fi';
import { AddNewZoneModal } from './AddNewZoneModal';
import { EditZoneModal } from './EditZoneModal';

export const ShippingRates = () => {
  const {
    data: zoneGroups = [],
    isLoading,
    isError,
    refetch,
  } = useGetZoneGroupsQuery();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<any | null>(null);

  const displayZoneGroups = useMemo(() => {
    // ⭐️ Backend ကလာတဲ့ နာမည် (၂) မျိုးလုံးကို ဖမ်းနိုင်မည့် Helper Function
    const checkIsDefault = (zone: any) =>
      zone.isCityDefault === true || zone.cityDefault === true;

    // က။ Default မဟုတ်သော Zone များကို ခွဲထုတ်မည် (Yangon Downtown)
    const specificZones = zoneGroups.filter((zone) => !checkIsDefault(zone));

    // ခ။ Default ဖြစ်သော Zone များကို ခွဲထုတ်မည် (Yangon Uptown Default)
    const defaultZones = zoneGroups.filter((zone) => checkIsDefault(zone));

    // ဂ။ Specific Zone တစ်ခုစီတိုင်းတွင် ၎င်း၏ City နှင့် တူညီသော Default Zone Data များကို ပေါင်းထည့်မည်
    return specificZones.map((specificZone) => {
      const matchingDefaultZone = defaultZones.find(
        (dz) => dz.city === specificZone.city
      );

      return {
        ...specificZone,
        hasDefaultRate: !!matchingDefaultZone,
        defaultZoneIds: matchingDefaultZone?.zoneIds || [],
        defaultShippingFee: matchingDefaultZone?.shippingFee,
        defaultEstimatedDays: matchingDefaultZone?.estimatedDays,
      };
    });
  }, [zoneGroups]);

  return (
    <div className={styles.container}>
      {/* Header Section */}
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
            Delivery Zones & Rates
          </h1>
          <p className="text-xs text-slate-500">
            Configure regional delivery zones, shipping fees, and estimated
            transit times
          </p>
        </div>

        <button
          type="button"
          className={styles.primaryAddBtn}
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
        <table className={`${styles.zoneTable} ${displayZoneGroups.length > 0 ? 'table-with-data' : 'table-empty'}`}>
          <thead>
            <tr>
              <th className="w-14 py-3 px-4 text-center text-xs font-medium text-slate-400 uppercase tracking-wider" style={{ textAlign: 'center' }}>No.</th>
              <th>Zone Name</th>
              <th>Region / City</th>
              <th>Townships</th>
              <th>Current Fee</th>
              <th>Est. Days</th>
              <th>Status</th>
              <th className="text-center" style={{ textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={8} className={styles.stateCell}>
                  Loading delivery zones...
                </td>
              </tr>
            ) : displayZoneGroups.length === 0 ? (
              <tr>
                <td colSpan={8} className={styles.stateCell}>
                  No delivery zones found. Click <strong>"Add New Zone"</strong>{' '}
                  to create one.
                </td>
              </tr>
            ) : (
              displayZoneGroups.map((zone, index) => (
                <tr key={`${zone.zoneName}_${zone.city}`}>
                  <td className="text-center" style={{ fontWeight: 600, color: '#64748b', textAlign: 'center' }}>{index + 1}</td>
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
                    {(zone.shippingFee ?? 0).toLocaleString()} MMK
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
                  <td className="text-center" style={{ textAlign: 'center' }}>
                    <div className={styles.actionGroup}>
                      <button
                        type="button"
                        className="table-btn-edit"
                        title="Edit Zone & Rates"
                        onClick={() => setEditingZone(zone)}
                      >
                        <FiEdit2 size={13} /> Edit Zone & Rates
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AddNewZoneModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
      {editingZone && (
        <EditZoneModal
          isOpen={!!editingZone}
          zone={editingZone}
          onClose={() => setEditingZone(null)}
        />
      )}
    </div>
  );
};
