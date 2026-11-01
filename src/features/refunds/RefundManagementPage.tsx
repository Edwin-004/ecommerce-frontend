import { useEffect, useState, useRef } from 'react';
import {
  FiInbox,
  FiSearch,
  FiX,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiAlertCircle,
  FiFilter,
  FiCheck,
} from 'react-icons/fi';
import styles from './Refunds.module.css';
import {
  getRefunds,
  getRefundStats,
  approveRefund,
  rejectRefund,
  exportRefundReport,
  seedMockRefundData,
  type RefundRequestItem,
  type RefundStats,
  type RefundStatusFilter,
} from './refundApi';

const EXPORT_COLUMNS = [
  { key: 'refundId', label: 'Refund ID' },
  { key: 'orderNo', label: 'Order No' },
  { key: 'customerName', label: 'Customer' },
  { key: 'refundAmount', label: 'Amount' },
  { key: 'reason', label: 'Reason' },
  { key: 'status', label: 'Status' },
  { key: 'requestedDate', label: 'Requested Date' },
];

const REASON_LABELS: Record<string, string> = {
  DAMAGED_ITEM: 'Damaged Item',
  DEFECTIVE_PRODUCT: 'Defective Product',
  MISSING_PARTS: 'Missing Parts',
  ORDERED_BY_MISTAKE: 'Ordered By Mistake',
  WRONG_ITEM_SENT: 'Wrong Item Sent',
  OTHER: 'Other',
};

export function RefundManagementPage() {
  const [refunds, setRefunds] = useState<RefundRequestItem[]>([]);
  const [stats, setStats] = useState<RefundStats>({
    totalRequests: 0,
    pendingCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    totalRefundedAmount: 0,
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [status, setStatus] = useState<RefundStatusFilter>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Column Selector state
  const [selectedExportColumns, setSelectedExportColumns] = useState<string[]>([
    'refundId',
    'orderNo',
    'customerName',
    'refundAmount',
    'reason',
    'status',
    'requestedDate',
  ]);
  const [showColumnDropdown, setShowColumnDropdown] = useState<boolean>(false);
  const columnDropdownRef = useRef<HTMLDivElement>(null);

  // Export dropdown state
  const [showExportMenu, setShowExportMenu] = useState<boolean>(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const [exportingFormat, setExportingFormat] = useState<'pdf' | 'excel' | null>(null);
  const [exportSuccessMessage, setExportSuccessMessage] = useState<string | null>(null);

  // Decision Modal State
  const [activeModal, setActiveModal] = useState<{
    type: 'APPROVE' | 'REJECT';
    item: RefundRequestItem;
  } | null>(null);
  const [adminNoteInput, setAdminNoteInput] = useState<string>('');
  const [modalError, setModalError] = useState<string | null>(null);

  // Note View Modal State (for viewed processed items)
  const [viewNoteItem, setViewNoteItem] = useState<RefundRequestItem | null>(null);

  // Table Drag-To-Scroll & Modern Slide Toggle Bar
  const tableRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [startX, setStartX] = useState<number>(0);
  const [scrollLeftState, setScrollLeftState] = useState<number>(0);
  const [scrollPercent, setScrollPercent] = useState<number>(0);

  const updateScrollProgress = () => {
    if (!tableRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = tableRef.current;
    const maxScroll = scrollWidth - clientWidth;
    if (maxScroll > 0) {
      const pct = Math.min(100, Math.max(0, Math.round((scrollLeft / maxScroll) * 100)));
      setScrollPercent(pct);
    } else {
      setScrollPercent(0);
    }
  };

  const handleTableScroll = () => {
    updateScrollProgress();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, a, input, select, textarea, .btn')) {
      return;
    }
    if (!tableRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - tableRef.current.offsetLeft);
    setScrollLeftState(tableRef.current.scrollLeft);
  };

  useEffect(() => {
    if (!isDragging) return;

    const onMouseMove = (e: MouseEvent) => {
      if (!tableRef.current) return;
      e.preventDefault();
      const x = e.pageX - tableRef.current.offsetLeft;
      const walk = (x - startX) * 1.5;
      tableRef.current.scrollLeft = scrollLeftState - walk;
      updateScrollProgress();
    };

    const onMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isDragging, startX, scrollLeftState]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setScrollPercent(val);
    if (!tableRef.current) return;
    const { scrollWidth, clientWidth } = tableRef.current;
    const maxScroll = scrollWidth - clientWidth;
    if (maxScroll > 0) {
      tableRef.current.scrollLeft = (val / 100) * maxScroll;
    }
  };

  const scrollToEndpoint = (endpoint: 'start' | 'end') => {
    if (!tableRef.current) return;
    const { scrollWidth, clientWidth } = tableRef.current;
    const maxScroll = scrollWidth - clientWidth;
    tableRef.current.scrollTo({
      left: endpoint === 'start' ? 0 : maxScroll,
      behavior: 'smooth',
    });
  };

  const [seedingMock, setSeedingMock] = useState<boolean>(false);

  const handleSeedMockData = async () => {
    try {
      setSeedingMock(true);
      const res = await seedMockRefundData();
      await loadData();
      setExportSuccessMessage(`Mock Data Ready: ${res.message} (Total: ${res.totalRequests})`);
      setTimeout(() => setExportSuccessMessage(null), 4000);
    } catch (err: any) {
      console.error('Failed to seed mock data:', err);
      alert('Failed to seed mock data: ' + (err.message || 'Unknown error'));
    } finally {
      setSeedingMock(false);
    }
  };

  // =====================================================
  // FETCH DATA
  // =====================================================

  const loadData = async () => {
    try {
      setLoading(true);
      const [refundList, statData] = await Promise.all([
        getRefunds({
          search,
          status,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        }),
        getRefundStats(),
      ]);
      setRefunds(refundList);
      setStats(statData);
    } catch (err: any) {
      console.error('Failed to load refund data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, status, startDate, endDate]);

  // =====================================================
  // CLICK OUTSIDE LISTENER
  // =====================================================

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        columnDropdownRef.current &&
        !columnDropdownRef.current.contains(event.target as Node)
      ) {
        setShowColumnDropdown(false);
      }
      if (
        exportMenuRef.current &&
        !exportMenuRef.current.contains(event.target as Node)
      ) {
        setShowExportMenu(false);
      }
    };
    if (showColumnDropdown || showExportMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showColumnDropdown, showExportMenu]);

  // Auto-dismiss export message
  useEffect(() => {
    if (exportSuccessMessage) {
      const timer = setTimeout(() => {
        setExportSuccessMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [exportSuccessMessage]);

  // =====================================================
  // COLUMN SELECTOR HANDLERS
  // =====================================================

  const handleToggleColumn = (colKey: string) => {
    setSelectedExportColumns((prev) => {
      if (prev.includes(colKey)) {
        if (prev.length <= 1) {
          alert('At least one column must be selected for export.');
          return prev;
        }
        return prev.filter((k) => k !== colKey);
      } else {
        return [...prev, colKey];
      }
    });
  };

  const handleSelectAllColumns = () => {
    setSelectedExportColumns(EXPORT_COLUMNS.map((c) => c.key));
  };

  // =====================================================
  // EXPORT HANDLER (PDF & EXCEL ONLY)
  // =====================================================

  const handleExport = async (format: 'pdf' | 'excel') => {
    if (selectedExportColumns.length === 0) {
      alert('Please select at least one column to export.');
      return;
    }

    setExportingFormat(format);
    setExportSuccessMessage(null);

    try {
      const blob = await exportRefundReport(format, {
        search,
        status,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        columns: selectedExportColumns,
      });

      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      const todayStr = new Date().toISOString().slice(0, 10);
      const ext = format === 'excel' ? 'xlsx' : 'pdf';
      const filename = `refund_management_report_${todayStr}.${ext}`;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      setExportSuccessMessage(
        `Export successful: Downloaded ${filename} (${selectedExportColumns.length} columns)`
      );
    } catch (err: any) {
      console.error(`Export ${format.toUpperCase()} error:`, err);
      alert(`Failed to export ${format.toUpperCase()}: ${err.message || 'Please check connection'}`);
    } finally {
      setExportingFormat(null);
    }
  };

  // =====================================================
  // DECISION MODAL HANDLERS
  // =====================================================

  const openApproveModal = (item: RefundRequestItem) => {
    setActiveModal({ type: 'APPROVE', item });
    setAdminNoteInput('');
    setModalError(null);
  };

  const openRejectModal = (item: RefundRequestItem) => {
    setActiveModal({ type: 'REJECT', item });
    setAdminNoteInput('');
    setModalError(null);
  };

  const closeModal = () => {
    if (actionLoading) return;
    setActiveModal(null);
    setAdminNoteInput('');
    setModalError(null);
  };

  const handleConfirmDecision = async () => {
    if (!activeModal) return;

    if (activeModal.type === 'REJECT' && !adminNoteInput.trim()) {
      setModalError('Rejection reason / admin note is required to reject this refund request.');
      return;
    }

    try {
      setActionLoading(true);
      setModalError(null);

      if (activeModal.type === 'APPROVE') {
        await approveRefund(activeModal.item.refundId, adminNoteInput.trim());
      } else {
        await rejectRefund(activeModal.item.refundId, adminNoteInput.trim());
      }

      closeModal();
      await loadData();
    } catch (err: any) {
      console.error('Decision error:', err);
      setModalError(err.message || 'Action failed. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatus('ALL');
    setStartDate('');
    setEndDate('');
  };

  // Helper date formatter
  const formatDate = (isoString?: string | null) => {
    if (!isoString) return '-';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className={styles.container}>
      {/* EXPORT SUCCESS BANNER */}
      {exportSuccessMessage && (
        <div className={styles.exportSuccessBanner} role="alert">
          <div className={styles.bannerLeft}>
            <FiCheckCircle size={18} />
            <span>{exportSuccessMessage}</span>
          </div>
          <button
            type="button"
            className={styles.bannerCloseBtn}
            onClick={() => setExportSuccessMessage(null)}
            aria-label="Close"
          >
            <FiX size={16} />
          </button>
        </div>
      )}

      {/* HEADER */}
      <div className={styles.headerRow}>
        <div className={styles.headerLeft}>
          <div className={styles.smallBadge}>OPERATIONS</div>
          <h1 className={styles.title}>Refund Management</h1>
          <p className={styles.subtitle}>
            Directly review customer refund requests, process approvals or rejections, and export reports.
          </p>
        </div>
      </div>

      {/* STATS CARDS GRID */}
      <div className={styles.statsGrid}>
        {/* Total Requests */}
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.purple}`}>
            <FiInbox />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statLabel}>Total Requests</span>
            <span className={styles.statValue}>{stats.totalRequests}</span>
          </div>
        </div>

        {/* Pending Review */}
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.amber}`}>
            <FiClock />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statLabel}>Pending Review</span>
            <span className={`${styles.statValue} text-warning`}>{stats.pendingCount}</span>
          </div>
        </div>

        {/* Approved */}
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.green}`}>
            <FiCheckCircle />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statLabel}>Approved</span>
            <span className={`${styles.statValue} text-success`}>{stats.approvedCount}</span>
          </div>
        </div>

        {/* Rejected */}
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.red}`}>
            <FiXCircle />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statLabel}>Rejected</span>
            <span className={`${styles.statValue} text-danger`}>{stats.rejectedCount}</span>
          </div>
        </div>
      </div>

      {/* FILTER & TOOLBAR CARD */}
      <div className={styles.filterCardModern}>
        {/* Row 1: Search, Status, Dates, Reset */}
        <div className={styles.filterTopRow}>
          {/* Search */}
          <div className={styles.fieldWithLabel} style={{ flex: '1 1 260px', minWidth: '220px' }}>
            <label>SEARCH</label>
            <div className={styles.searchBox}>
              <FiSearch className={styles.searchIcon} />
              <input
                type="text"
                className={styles.fieldInputSearch}
                placeholder="Search Order No, Customer, Reason..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  type="button"
                  className={styles.clearSearchBtn}
                  onClick={() => setSearch('')}
                  aria-label="Clear search"
                >
                  <FiX size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Status Filter */}
          <div className={styles.fieldWithLabel} style={{ width: '150px' }}>
            <label>STATUS</label>
            <select
              className={styles.fieldSelectControl}
              value={status}
              onChange={(e) => setStatus(e.target.value as RefundStatusFilter)}
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          {/* Date Range: FROM */}
          <div className={styles.fieldWithLabel} style={{ width: '145px' }}>
            <label>FROM</label>
            <input
              type="date"
              className={styles.fieldDateControl}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              title="Start Date"
            />
          </div>

          {/* Date Range: TO */}
          <div className={styles.fieldWithLabel} style={{ width: '145px' }}>
            <label>TO</label>
            <input
              type="date"
              className={styles.fieldDateControl}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              title="End Date"
            />
          </div>

          {/* Reset Filters button */}
          {(search || status !== 'ALL' || startDate || endDate) && (
            <div className={styles.fieldWithLabel} style={{ alignSelf: 'flex-end' }}>
              <button
                type="button"
                className={styles.btnResetFilter}
                onClick={handleResetFilters}
                title="Reset all filters"
              >
                <FiFilter size={14} />
                <span>Reset</span>
              </button>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className={styles.filterDivider} />

        {/* Row 2: Results Info + Action Buttons */}
        <div className={styles.filterBottomRow}>
          <div className={styles.filterResultsPill}>
            <span className={styles.resultsDot} />
            <span>
              Showing <strong>{refunds.length}</strong> refund {refunds.length === 1 ? 'record' : 'records'}
              {(search || status !== 'ALL' || startDate || endDate) && ' (filtered)'}
            </span>
          </div>

          <div className={styles.filterActionsBar}>
            {/* Column Selector Popover */}
            <div className={styles.columnSelectorContainer} ref={columnDropdownRef}>
              <button
                type="button"
                className={styles.btnActionItem}
                onClick={() => setShowColumnDropdown((prev) => !prev)}
                title="Select columns to export"
              >
                <i className="bi bi-sliders text-secondary" />
                <span>Columns ({selectedExportColumns.length}/{EXPORT_COLUMNS.length})</span>
              </button>

              {showColumnDropdown && (
                <div className={styles.columnDropdownMenu}>
                  <div className={styles.columnDropdownHeader}>
                    <span className={styles.columnDropdownTitle}>Export Columns</span>
                    <button
                      type="button"
                      className={styles.columnDropdownAction}
                      onClick={handleSelectAllColumns}
                    >
                      Select All
                    </button>
                  </div>

                  <div className={styles.columnCheckboxList}>
                    {EXPORT_COLUMNS.map((col) => (
                      <label key={col.key} className={styles.columnCheckboxLabel}>
                        <input
                          type="checkbox"
                          checked={selectedExportColumns.includes(col.key)}
                          onChange={() => handleToggleColumn(col.key)}
                        />
                        <span>{col.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Seed Mock Data Button */}
            <button
              type="button"
              className={styles.btnActionSeed}
              onClick={handleSeedMockData}
              disabled={seedingMock}
              title="Seed test refund requests and notifications"
            >
              <i className={seedingMock ? 'spinner-border spinner-border-sm' : 'bi bi-database-fill-add'} />
              <span>{seedingMock ? 'Seeding...' : 'Seed Test Data'}</span>
            </button>

            {/* Export Dropdown Menu (PDF & Excel Only) */}
            <div className={styles.exportDropdownContainer} ref={exportMenuRef}>
              <button
                type="button"
                className={`${styles.btnActionExport} ${exportingFormat ? styles.btnActionExporting : ''}`}
                onClick={() => setShowExportMenu((prev) => !prev)}
                disabled={!!exportingFormat}
                title="Export filtered refunds as PDF or Excel"
              >
                {exportingFormat ? (
                  <>
                    <span className={styles.exportSpinner} />
                    <span>Exporting...</span>
                  </>
                ) : (
                  <>
                    <i className="bi bi-download" />
                    <span>Export</span>
                    <i className="bi bi-chevron-down" style={{ fontSize: '11px', marginLeft: '2px' }} />
                  </>
                )}
              </button>

              {showExportMenu && !exportingFormat && (
                <div className={styles.exportDropdownMenu}>
                  <div className={styles.exportDropdownHeader}>Export As</div>

                  {/* Export Excel */}
                  <button
                    type="button"
                    className={styles.exportMenuItem}
                    onClick={() => {
                      setShowExportMenu(false);
                      void handleExport('excel');
                    }}
                  >
                    <div className={styles.exportMenuIconExcel}>
                      <i className="bi bi-file-earmark-excel fs-5" />
                    </div>
                    <div className={styles.exportMenuText}>
                      <span className={styles.exportMenuTitle}>Excel Spreadsheet</span>
                      <span className={styles.exportMenuSub}>.xlsx format</span>
                    </div>
                  </button>

                  {/* Export PDF */}
                  <button
                    type="button"
                    className={styles.exportMenuItem}
                    onClick={() => {
                      setShowExportMenu(false);
                      void handleExport('pdf');
                    }}
                  >
                    <div className={styles.exportMenuIconPdf}>
                      <i className="bi bi-file-earmark-pdf fs-5" />
                    </div>
                    <div className={styles.exportMenuText}>
                      <span className={styles.exportMenuTitle}>PDF Document</span>
                      <span className={styles.exportMenuSub}>.pdf format</span>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* DATA TABLE CARD - ORIGINAL 8 COLUMNS WITH MODERN SLIDE BAR & DRAG-TO-SCROLL */}
      <div className={styles.tableCard}>
        {/* Modern Interactive Slide Toggle Bar */}
        <div className={styles.scrollNoticeBar}>
          <div className={styles.scrollNoticeLeft}>
            <i className="bi bi-arrows-expand text-primary" style={{ transform: 'rotate(45deg)', fontSize: '13px' }} />
            <span className={styles.scrollNoticeTitle}>Table Slide Bar:</span>
            <span className={styles.scrollNoticeTag}>
              {scrollPercent <= 5 ? 'Start (Refund ID)' : scrollPercent >= 95 ? 'End (Actions)' : `${scrollPercent}%`}
            </span>
          </div>

          <div className={styles.slideToggleWrapper}>
            <button
              type="button"
              className={styles.sliderEndpointBtn}
              onClick={() => scrollToEndpoint('start')}
              title="Jump to Start (Refund ID)"
            >
              <i className="bi bi-chevron-left" /> Left (Refund ID)
            </button>
            <div className={styles.sliderTrackContainer}>
              <input
                type="range"
                min="0"
                max="100"
                value={scrollPercent}
                onChange={handleSliderChange}
                className={styles.modernSlideRange}
                title="Slide cursor across this bar to scroll table sideways"
                style={{
                  background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${scrollPercent}%, #e2e8f0 ${scrollPercent}%, #e2e8f0 100%)`
                }}
              />
            </div>
            <button
              type="button"
              className={styles.sliderEndpointBtn}
              onClick={() => scrollToEndpoint('end')}
              title="Jump to Actions"
            >
              Right (Actions) <i className="bi bi-chevron-right" />
            </button>
          </div>
        </div>

        <div
          ref={tableRef}
          className={`${styles.tableResponsive} ${isDragging ? styles.isDragging : ''}`}
          onMouseDown={handleMouseDown}
          onScroll={handleTableScroll}
        >
          <table className={styles.modernTable}>
            <thead>
              <tr>
                <th style={{ paddingLeft: '24px', width: '100px' }}>REFUND ID</th>
                <th style={{ width: '160px' }}>ORDER NO</th>
                <th style={{ minWidth: '180px' }}>CUSTOMER</th>
                <th style={{ width: '140px' }}>AMOUNT</th>
                <th style={{ width: '160px' }}>REASON</th>
                <th style={{ width: '125px' }}>DATE</th>
                <th style={{ width: '120px' }}>STATUS</th>
                <th style={{ textAlign: 'right', paddingRight: '24px', width: '170px' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8}>
                    <div className={styles.loadingBox}>
                      <div className="spinner-border spinner-border-sm text-primary mb-2" role="status" />
                      <div>Fetching refund requests...</div>
                    </div>
                  </td>
                </tr>
              ) : refunds.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: 0 }}>
                    <div className={styles.emptyStateBox}>
                      <div className={styles.emptyStateIconWrapper}>
                        <FiInbox size={26} />
                      </div>
                      <div className={styles.emptyStateSmallTag}>NO DATA RECORD</div>
                      <h3 className={styles.emptyStateBigTitle}>No Refund Requests Found</h3>
                      <p className={styles.emptyStateSubtext}>
                        {search || status !== 'ALL' || startDate || endDate
                          ? 'No refund records match your selected filter criteria.'
                          : 'There are no refund requests in the database yet.'}
                      </p>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm mt-3"
                        onClick={handleSeedMockData}
                        disabled={seedingMock}
                        style={{ backgroundColor: '#4f46e5', borderColor: '#4f46e5', borderRadius: '8px', padding: '7px 18px', fontWeight: 600 }}
                      >
                        <i className="bi bi-database-add me-2" />
                        {seedingMock ? 'Generating Test Data...' : 'Generate Mock Refund Data'}
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                refunds.map((item) => {
                  const isPending = item.status === 'PENDING';
                  const isApproved = item.status === 'APPROVED';
                  const isRejected = item.status === 'REJECTED';

                  return (
                    <tr key={item.refundId}>
                      {/* 1. REFUND ID */}
                      <td style={{ paddingLeft: '24px' }}>
                        <span className={styles.refundIdText}>#{item.refundId}</span>
                      </td>

                      {/* 2. ORDER NO */}
                      <td>
                        <span className={styles.orderBadge}>
                          <i className="bi bi-receipt" style={{ fontSize: '11px', color: '#64748b' }} />
                          {item.orderNo || `Order #${item.orderId || '-'}`}
                        </span>
                      </td>

                      {/* 3. CUSTOMER */}
                      <td>
                        <div className={styles.customerName}>
                          {item.customerName || 'Anonymous Customer'}
                        </div>
                        {item.customerEmail && (
                          <div className={styles.customerEmail}>{item.customerEmail}</div>
                        )}
                      </td>

                      {/* 4. AMOUNT (with Product Name & Quantity subtitle) */}
                      <td>
                        <div className={styles.amountText}>
                          ${Number(item.refundAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        {item.productName && (
                          <div className={styles.productNameSub} title={item.productName}>
                            <i className="bi bi-box-seam me-1 text-secondary" style={{ fontSize: '11px' }} />
                            <span>{item.productName}</span>
                            {item.refundQuantity && item.refundQuantity > 1 && (
                              <span className={styles.quantityBadge}>x{item.refundQuantity}</span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* 5. REASON */}
                      <td>
                        <span className={styles.reasonBadge}>
                          {REASON_LABELS[item.reason || ''] || item.reason || '-'}
                        </span>
                      </td>

                      {/* 6. DATE */}
                      <td>
                        <span className={styles.dateText}>
                          <i className="bi bi-calendar3 me-1 text-muted" style={{ fontSize: '11px' }} />
                          {formatDate(item.requestedAt)}
                        </span>
                      </td>

                      {/* 7. STATUS */}
                      <td>
                        {isPending && (
                          <span className={styles.badgePending}>
                            <FiClock size={12} /> Pending
                          </span>
                        )}
                        {isApproved && (
                          <span className={styles.badgeApproved}>
                            <FiCheckCircle size={12} /> Approved
                          </span>
                        )}
                        {isRejected && (
                          <span className={styles.badgeRejected}>
                            <FiXCircle size={12} /> Rejected
                          </span>
                        )}
                      </td>

                      {/* 8. ACTIONS */}
                      <td style={{ textAlign: 'right', paddingRight: '24px' }}>
                        {isPending ? (
                          <div className={styles.actionGroup}>
                            <button
                              type="button"
                              className={styles.btnApprove}
                              onClick={() => openApproveModal(item)}
                              title="Approve refund request"
                            >
                              <FiCheck size={13} />
                              <span>Approve</span>
                            </button>
                            <button
                              type="button"
                              className={styles.btnReject}
                              onClick={() => openRejectModal(item)}
                              title="Reject refund request"
                            >
                              <FiX size={13} />
                              <span>Reject</span>
                            </button>
                          </div>
                        ) : (
                          <div className={styles.actionGroup}>
                            {item.adminNote && (
                              <button
                                type="button"
                                className={styles.btnNote}
                                onClick={() => setViewNoteItem(item)}
                                title="View admin note"
                              >
                                <i className="bi bi-chat-left-text me-1" />
                                <span>Note</span>
                              </button>
                            )}
                            <span className={isApproved ? styles.closedApproved : styles.closedRejected}>
                              {isApproved ? 'Approved' : 'Rejected'}
                            </span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* TABLE FOOTER */}
        <div className={styles.tableFooter}>
          <span className={styles.footerCount}>
            Showing <strong>{refunds.length}</strong> refund request
            {refunds.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* CONFIRMATION DECISION MODAL (APPROVE / REJECT) */}
      {activeModal && (
        <div className={styles.modalBackdrop} onClick={closeModal}>
          <div className={styles.modalDialog} onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className={styles.modalHeader}>
              <div className="d-flex align-items-center gap-2">
                {activeModal.type === 'APPROVE' ? (
                  <div className="text-success fs-5">
                    <FiCheckCircle />
                  </div>
                ) : (
                  <div className="text-danger fs-5">
                    <FiAlertCircle />
                  </div>
                )}
                <h5 className="modal-title fw-bold mb-0">
                  {activeModal.type === 'APPROVE'
                    ? `Approve Refund #${activeModal.item.refundId}`
                    : `Reject Refund #${activeModal.item.refundId}`}
                </h5>
              </div>
              <button
                type="button"
                className="btn-close"
                onClick={closeModal}
                disabled={actionLoading}
                aria-label="Close"
              />
            </div>

            {/* Modal Body */}
            <div className={styles.modalBody}>
              {modalError && (
                <div className="alert alert-danger py-2 small mb-3" role="alert">
                  {modalError}
                </div>
              )}

              {/* Order & Customer Details Preview */}
              <div className={styles.detailCard}>
                <div className={styles.detailGrid}>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Order No</span>
                    <span className={styles.detailValue}>
                      {activeModal.item.orderNo || `#${activeModal.item.orderId}`}
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Customer</span>
                    <span className={styles.detailValue}>
                      {activeModal.item.customerName || 'Customer'}
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Refund Amount</span>
                    <span className={`${styles.detailValue} text-primary`}>
                      ${Number(activeModal.item.refundAmount || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Reason</span>
                    <span className={styles.detailValue}>
                      {REASON_LABELS[activeModal.item.reason || ''] || activeModal.item.reason || '-'}
                    </span>
                  </div>
                </div>
              </div>

              {activeModal.type === 'APPROVE' ? (
                <div className="mb-3">
                  <label className="form-label fw-semibold small">
                    Admin Approval Note <span className="text-muted fw-normal">(Optional)</span>
                  </label>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="e.g. Return received and verified in warehouse; proceed with payment refund."
                    value={adminNoteInput}
                    onChange={(e) => setAdminNoteInput(e.target.value)}
                    disabled={actionLoading}
                  />
                  <small className="text-muted mt-1 d-block">
                    Approving will mark the order payment status as <strong>REFUNDED</strong>.
                  </small>
                </div>
              ) : (
                <div className="mb-3">
                  <label className="form-label fw-semibold small">
                    Rejection Reason / Admin Note <span className="text-danger">*</span>
                  </label>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="e.g. Returned item does not meet warranty conditions or is missing original accessories."
                    value={adminNoteInput}
                    onChange={(e) => setAdminNoteInput(e.target.value)}
                    disabled={actionLoading}
                    required
                  />
                  <small className="text-danger mt-1 d-block">
                    A rejection note is required to inform the customer and record internal audit reasons.
                  </small>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className={styles.modalFooter}>
              <button
                type="button"
                className="btn btn-light border px-3"
                onClick={closeModal}
                disabled={actionLoading}
              >
                Cancel
              </button>
              {activeModal.type === 'APPROVE' ? (
                <button
                  type="button"
                  className="btn btn-success px-4 d-flex align-items-center gap-2"
                  onClick={handleConfirmDecision}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm" />
                      <span>Approving...</span>
                    </>
                  ) : (
                    <>
                      <FiCheck />
                      <span>Confirm Approval</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-danger px-4 d-flex align-items-center gap-2"
                  onClick={handleConfirmDecision}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm" />
                      <span>Rejecting...</span>
                    </>
                  ) : (
                    <>
                      <FiX />
                      <span>Confirm Rejection</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW ADMIN NOTE MODAL */}
      {viewNoteItem && (
        <div className={styles.modalBackdrop} onClick={() => setViewNoteItem(null)}>
          <div className={styles.modalDialog} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h5 className="modal-title fw-bold mb-0">
                Refund #{viewNoteItem.refundId} - Admin Note
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setViewNoteItem(null)}
                aria-label="Close"
              />
            </div>
            <div className={styles.modalBody}>
              <div className="mb-2">
                <span className="badge bg-light text-dark border me-2">
                  Status: {viewNoteItem.status}
                </span>
                {viewNoteItem.processedByName && (
                  <small className="text-muted">
                    Processed by: <strong>{viewNoteItem.processedByName}</strong>
                  </small>
                )}
              </div>
              <div className="p-3 bg-light rounded text-dark mt-2 border">
                {viewNoteItem.adminNote || 'No remark was provided.'}
              </div>
              {viewNoteItem.processedAt && (
                <small className="text-muted mt-2 d-block text-end">
                  Processed on: {new Date(viewNoteItem.processedAt).toLocaleString()}
                </small>
              )}
            </div>
            <div className={styles.modalFooter}>
              <button
                type="button"
                className="btn btn-secondary px-4"
                onClick={() => setViewNoteItem(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RefundManagementPage;
