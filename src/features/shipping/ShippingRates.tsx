import { BackButton } from '../../components/common/BackButton';
import { useEffect, useMemo, useState } from 'react';
import {
  useGetZoneGroupsQuery,
  useToggleZoneStatusMutation,
} from './shippingApi';
import styles from './ShippingRates.module.css';
import {
  FiTruck,
  FiPlus,
  FiEdit2,
  FiCheckCircle,
  FiXCircle,
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
} from 'react-icons/fi';
import { AddNewZoneModal } from './AddNewZoneModal';
import { EditZoneModal } from './EditZoneModal';

export const ShippingRates = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<any | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const pageSize = 10;

  useEffect(() => {
    setCurrentPage(0);
  }, [searchTerm, statusFilter]);

  const {
    data: zoneGroupsResponse,
    isLoading,
    isError,
    refetch,
  } = useGetZoneGroupsQuery({
    page: currentPage,
    size: pageSize,
    search: searchTerm,
    status: statusFilter,
  });

  const zoneGroups = zoneGroupsResponse?.content || [];
  const totalPages = zoneGroupsResponse?.totalPages || 0;

  const [toggleStatus] = useToggleZoneStatusMutation();

  const handleToggleStatus = async (zone: any) => {
    const newStatus = zone.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    if (
      window.confirm(
        `Are you sure you want to mark ${zone.zoneName} as ${newStatus}?`
      )
    ) {
      try {
        await toggleStatus({
          zoneName: zone.zoneName,
          city: zone.city,
          newStatus,
        }).unwrap();
      } catch (err) {
        alert('Failed to change status. Please try again.');
      }
    }
  };

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <BackButton fallbackUrl="/admin/dashboard" />
          <div className={styles.titleArea}>
            <h1>
              <FiTruck /> Delivery Zones & Rates
            </h1>
            <p>
              Configure regional delivery zones, shipping fees, and estimated
              transit times
            </p>
          </div>
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

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', gap: '8px' }}>
          {['ALL', 'ACTIVE', 'INACTIVE'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              style={{
                padding: '6px 16px',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                background: statusFilter === status ? '#e0e7ff' : '#fff',
                color: statusFilter === status ? '#4338ca' : '#475569',
                fontWeight: statusFilter === status ? '600' : '400',
                cursor: 'pointer',
              }}
            >
              {status}
            </button>
          ))}
        </div>
        <div style={{ position: 'relative' }}>
          <FiSearch
            style={{
              position: 'absolute',
              top: '10px',
              left: '12px',
              color: '#94a3b8',
            }}
          />
          <input
            type="text"
            placeholder="Search zones, cities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '8px 12px 8px 36px',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              width: '250px',
            }}
          />
        </div>
      </div>

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
            ) : displayZoneGroups.length === 0 ? (
              <tr>
                <td colSpan={7} className={styles.stateCell}>
                  No delivery zones found matching your search or filter.
                </td>
              </tr>
            ) : (
              displayZoneGroups.map((zone) => (
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
                        {zone.townships.map((t: string) => (
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
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(zone)}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                      title="Click to toggle status"
                    >
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
                    </button>
                  </td>
                  <td>
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
        {/* Pagination Controls */}
        {zoneGroups.length > 0 && totalPages > 1 && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '16px',
              borderTop: '1px solid #e2e8f0',
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: '14px', color: '#64748b' }}>
              Page {currentPage + 1} of {totalPages}
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 0))}
                disabled={currentPage === 0}
                style={{
                  padding: '6px 12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '4px',
                  cursor: currentPage === 0 ? 'not-allowed' : 'pointer',
                }}
              >
                <FiChevronLeft /> Previous
              </button>
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1))
                }
                disabled={
                  zoneGroupsResponse?.last || currentPage === totalPages - 1
                }
                style={{
                  padding: '6px 12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '4px',
                  cursor:
                    zoneGroupsResponse?.last || currentPage === totalPages - 1
                      ? 'not-allowed'
                      : 'pointer',
                }}
              >
                Next <FiChevronRight />
              </button>
            </div>
          </div>
        )}

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
