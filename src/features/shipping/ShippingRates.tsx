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
import { BulkEditRateModal } from './BulkEditRateModal';
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

  const updateShippingParams = (updates: {
    page?: number;
    status?: string;
    search?: string;
  }) => {
    const next = new URLSearchParams(searchParams);
    const nextStatus =
      updates.status !== undefined ? updates.status : statusFilter;
    const nextSearch =
      updates.search !== undefined ? updates.search : searchTerm;
    const nextPage = updates.page !== undefined ? updates.page : 0;

    if (nextStatus && nextStatus !== 'ALL') next.set('status', nextStatus);
    else next.delete('status');
    if (nextSearch && nextSearch.trim()) next.set('search', nextSearch.trim());
    else next.delete('search');
    if (nextPage > 0) next.set('page', String(nextPage));
    else next.delete('page');

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

  const pageSize = 5;

  const { data: stats } = useGetZoneStatsQuery();
  const [selectedZoneGroups, setSelectedZoneGroups] = useState<any[]>([]);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

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
      {/* Header */}
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

      {/* 3 Stat Cards Grid (Matching Categories & Brands Pages) */}
      <div className={styles.statsGrid}>
        <div
          className={`${styles.statCard} ${statusFilter === 'ALL' ? styles.statCardActive : ''}`}
          onClick={() => setStatusFilter('ALL')}
          title="Filter by All Delivery Zones"
        >
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Total Zones</span>
            <h3 className={styles.statValue}>{stats?.total ?? 0}</h3>
          </div>
          <div className={`${styles.statIconBox} ${styles.blue}`}>
            <FiTruck size={20} />
          </div>
        </div>

        <div
          className={`${styles.statCard} ${statusFilter === 'ACTIVE' ? styles.statCardActive : ''}`}
          onClick={() => setStatusFilter('ACTIVE')}
          title="Filter by Active Zones"
        >
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Active Zones</span>
            <h3 className={styles.statValue}>{stats?.active ?? 0}</h3>
          </div>
          <div className={`${styles.statIconBox} ${styles.green}`}>
            <FiCheckCircle size={20} />
          </div>
        </div>

        <div
          className={`${styles.statCard} ${statusFilter === 'INACTIVE' ? styles.statCardActive : ''}`}
          onClick={() => setStatusFilter('INACTIVE')}
          title="Filter by Inactive Zones"
        >
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Inactive Zones</span>
            <h3 className={styles.statValue}>{stats?.inactive ?? 0}</h3>
          </div>
          <div className={`${styles.statIconBox} ${styles.orange}`}>
            <FiXCircle size={20} />
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Toolbar */}
      <div className={styles.toolbarCard}>
        <div className={styles.statusTabs}>
          {['ALL', 'ACTIVE', 'INACTIVE'].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`${styles.statusTabBtn} ${
                statusFilter === status ? styles.statusTabBtnActive : ''
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        <div
          style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          {selectedZoneGroups.length > 0 && (
            <button
              type="button"
              onClick={() => setIsBulkModalOpen(true)}
              className={styles.bulkUpdateBtn}
            >
              <FiEdit2 size={13} />
              Bulk Update
            </button>
          )}

          <div className={styles.searchBox}>
            <FiSearch className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search zones, cities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table
          className={`${styles.zoneTable} ${displayZoneGroups.length > 0 ? 'table-with-data' : 'table-empty'}`}
        >
          <thead>
            <tr>
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
              <th className="text-center" style={{ textAlign: 'center' }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={9} className={styles.stateCell}>
                  Loading delivery zones...
                </td>
              </tr>
            ) : displayZoneGroups.length === 0 ? (
              <tr>
                <td colSpan={9} className={styles.stateCell}>
                  No delivery zones found. Click <strong>"Add New Zone"</strong>{' '}
                  to create one.
                </td>
              </tr>
            ) : (
              displayZoneGroups
                .filter((zone) => !zone.zoneName.startsWith('DELETED_ZONE'))
                .map((zone) => {
                  return (
                    <tr key={`${zone.zoneName}_${zone.city}`}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedZoneGroups.some(
                            (zg) =>
                              zg.zoneName === zone.zoneName &&
                              zg.city === zone.city
                          )}
                          onChange={(e) =>
                            handleSelectZone(zone, e.target.checked)
                          }
                        />
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{zone.zoneName}</div>
                        <div className={styles.subText}>{zone.zoneCode}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{zone.city}</div>
                        <div className={styles.subText}>
                          {zone.regionOrState}
                        </div>
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
                        {zone.estimatedDays
                          ? `${zone.estimatedDays} Days`
                          : '-'}
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
                      <td
                        className="text-center"
                        style={{ textAlign: 'center' }}
                      >
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
                  );
                })
            )}
          </tbody>
        </table>

        {/* ⭐️ ဖြည့်စွက်ထားသော Pagination အပိုင်း ⭐️ */}
        {zoneGroups.length > 0 && totalPages > 0 && (
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
                onClick={() => setCurrentPage(Math.max(currentPage - 1, 0))}
                disabled={currentPage === 0}
                style={{
                  padding: '6px 12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '4px',
                  cursor: currentPage === 0 ? 'not-allowed' : 'pointer',
                }}
              >
                <FiChevronLeft size={15} /> Previous
              </button>
              <button
                onClick={() =>
                  setCurrentPage(Math.min(currentPage + 1, totalPages - 1))
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
                Next <FiChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ⭐️ ဖြည့်စွက်ထားသော BulkEditRateModal အပိုင်း ⭐️ */}
      <BulkEditRateModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        selectedZones={selectedZoneGroups}
        onSuccess={() => {
          setSelectedZoneGroups([]);
          refetch();
        }}
      />

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
