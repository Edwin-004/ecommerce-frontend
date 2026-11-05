import { BackButton } from '../../components/common/BackButton';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  useGetZoneGroupsQuery,
  useToggleZoneStatusMutation,
  useGetZoneStatsQuery,
} from './shippingApi';
import styles from './ShippingRates.module.css';
import {
  FiPlus,
  FiEdit2,
  FiCheckCircle,
  FiXCircle,
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
  FiTruck,
} from 'react-icons/fi';
import { AddNewZoneModal } from './AddNewZoneModal';
import { EditZoneModal } from './EditZoneModal';
import { BulkEditRateModal } from './BulkEditRateModal'; // BulkEditRateModal ကို Import လုပ်ရန်
import Swal from 'sweetalert2';

export const ShippingRates = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<any | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const paramPage = Number(searchParams.get('page')) || 0;
  const paramStatus = searchParams.get('status') || 'ALL';
  const paramSearch = searchParams.get('search') || '';

  const [currentPage, setCurrentPageState] = useState(paramPage);
  const [searchTerm, setSearchTermState] = useState(paramSearch);
  const [statusFilter, setStatusFilterState] = useState(paramStatus);

  const updateShippingParams = (updates: { page?: number; status?: string; search?: string }) => {
    const next = new URLSearchParams(searchParams);
    const nextStatus = updates.status !== undefined ? updates.status : statusFilter;
    const nextSearch = updates.search !== undefined ? updates.search : searchTerm;
    const nextPage = updates.page !== undefined ? updates.page : 0;

    if (nextStatus && nextStatus !== 'ALL') next.set('status', nextStatus); else next.delete('status');
    if (nextSearch && nextSearch.trim()) next.set('search', nextSearch.trim()); else next.delete('search');
    if (nextPage > 0) next.set('page', String(nextPage)); else next.delete('page');

    setSearchParams(next, { replace: true });
  };

  const setStatusFilter = (st: string) => {
    setStatusFilterState(st);
    setCurrentPageState(0);
    updateShippingParams({ status: st, page: 0 });
  };

  const setSearchTerm = (s: string) => {
    setSearchTermState(s);
    setCurrentPageState(0);
    updateShippingParams({ search: s, page: 0 });
  };

  const setCurrentPage = (p: number) => {
    setCurrentPageState(p);
    updateShippingParams({ page: p });
  };

  useEffect(() => {
    setStatusFilterState(searchParams.get('status') || 'ALL');
    setSearchTermState(searchParams.get('search') || '');
    setCurrentPageState(Number(searchParams.get('page')) || 0);
  }, [searchParams]);


  const pageSize = 10;

  const { data: stats } = useGetZoneStatsQuery();
  const [selectedZoneGroups, setSelectedZoneGroups] = useState<any[]>([]);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

  useEffect(() => {
    // Reset handled by updateShippingParams
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

    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to mark ${zone.zoneName} as ${newStatus}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, change it!',
    });
    if (result.isConfirmed) {
      try {
        await toggleStatus({
          zoneName: zone.zoneName,
          city: zone.city,
          newStatus,
        }).unwrap();
        Swal.fire('Updated!', 'Zone status has been changed.', 'success');
      } catch (err) {
        Swal.fire('Error!', 'Failed to change status.', 'error');
      }
    }
  };

  const displayZoneGroups = useMemo(() => {
    const checkIsDefault = (zone: any) =>
      zone.isCityDefault === true || zone.cityDefault === true;

    const specificZones = zoneGroups.filter((zone) => !checkIsDefault(zone));
    const defaultZones = zoneGroups.filter((zone) => checkIsDefault(zone));

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

  const handleSelectZone = (zone: any, isChecked: boolean) => {
    if (isChecked) {
      setSelectedZoneGroups((prev) => [...prev, zone]);
    } else {
      setSelectedZoneGroups((prev) =>
        prev.filter(
          (zg) => !(zg.zoneName === zone.zoneName && zg.city === zone.city)
        )
      );
    }
  };

  const handleSelectAll = (isChecked: boolean) => {
    if (isChecked) {
      setSelectedZoneGroups(displayZoneGroups);
    } else {
      setSelectedZoneGroups([]);
    }
  };

  return (
    <div className={styles.container}>
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
            <div
              style={{ marginTop: '8px', fontSize: '14px', color: '#64748b' }}
            >
              Total Zones:{' '}
              <strong style={{ color: '#0f172a' }}>{stats?.total || 0}</strong>{' '}
              &nbsp;|&nbsp; Active Zones:{' '}
              <strong style={{ color: '#10b981' }}>{stats?.active || 0}</strong>{' '}
              &nbsp;|&nbsp; Inactive Zones:{' '}
              <strong style={{ color: '#ef4444' }}>
                {stats?.inactive || 0}
              </strong>
            </div>
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

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {selectedZoneGroups.length > 0 && (
            <button
              onClick={() => setIsBulkModalOpen(true)}
              style={{
                backgroundColor: '#f59e0b',
                color: '#fff',
                padding: '8px 16px',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600',
              }}
            >
              <FiEdit2 style={{ display: 'inline', marginRight: '6px' }} />
              Bulk Update ({selectedZoneGroups.length})
            </button>
          )}

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
      </div>

      <div className={styles.tableContainer}>
        <table className={`${styles.zoneTable} ${displayZoneGroups.length > 0 ? 'table-with-data' : 'table-empty'}`}>
          <thead>
            <tr>
              <th className="w-14 py-3 px-4 text-center text-xs font-medium text-slate-400 uppercase tracking-wider" style={{ textAlign: 'center' }}>No.</th>
              <th style={{ width: '40px' }}>
                <input
                  type="checkbox"
                  checked={
                    displayZoneGroups.length > 0 &&
                    selectedZoneGroups.length === displayZoneGroups.length
                  }
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
              </th>
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
                    <input
                      type="checkbox"
                      checked={selectedZoneGroups.some(
                        (zg) =>
                          zg.zoneName === zone.zoneName && zg.city === zone.city
                      )}
                      onChange={(e) => handleSelectZone(zone, e.target.checked)}
                    />
                  </td>
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
