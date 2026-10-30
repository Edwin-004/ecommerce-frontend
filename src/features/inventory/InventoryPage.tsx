import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FiBox,
  FiAlertTriangle,
  FiAlertCircle,
  FiRefreshCw,
  FiSearch,
  FiPlusCircle,
  FiMinusCircle,
  FiSliders,
  FiClock,
  FiCheckCircle,
  FiPackage,
  FiDownload,
  FiChevronDown,
  FiFileText,
} from 'react-icons/fi';
import styles from './Inventory.module.css';
import { inventoryApi } from './inventoryApi';
import type { InventoryItem, InventoryTransaction } from '../../types/inventory';
import {
  RestockModal,
  WriteOffModal,
  AdjustModal,
  VariantHistoryModal,
} from './InventoryModals';
import { Pagination } from '../../components/common/Pagination';


const INVENTORY_EXPORT_COLUMNS = [
  { key: 'variantAndSku', label: 'Variant & SKU' },
  { key: 'product', label: 'Product' },
  { key: 'sellingPrice', label: 'Selling Price' },
  { key: 'physicalStock', label: 'Physical Stock' },
  { key: 'reservedStock', label: 'Reserved' },
  { key: 'availableStock', label: 'Available' },
  { key: 'reorderLevel', label: 'Reorder Level' },
  { key: 'expiryAndBatch', label: 'Expiry & Batch' },
  { key: 'status', label: 'Status' },
];

export const InventoryPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [activeTab, setActiveTab] = useState<'ALL' | 'LOW_STOCK' | 'EXPIRING_SOON' | 'TRANSACTIONS'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [txnTypeFilter, setTxnTypeFilter] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dynamic Export Column Selector state (PDF & Excel ONLY)
  const [selectedExportColumns, setSelectedExportColumns] = useState<string[]>([
    'variantAndSku',
    'product',
    'sellingPrice',
    'physicalStock',
    'reservedStock',
    'availableStock',
    'reorderLevel',
    'expiryAndBatch',
    'status',
  ]);
  const [showColumnDropdown, setShowColumnDropdown] = useState<boolean>(false);
  const columnDropdownRef = useRef<HTMLDivElement>(null);
  const [showExportDropdown, setShowExportDropdown] = useState<boolean>(false);
  const exportDropdownRef = useRef<HTMLDivElement>(null);
  const [exportingFormat, setExportingFormat] = useState<'excel' | 'pdf' | null>(null);
  const [exportSuccessMessage, setExportSuccessMessage] = useState<string | null>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        columnDropdownRef.current &&
        !columnDropdownRef.current.contains(target)
      ) {
        setShowColumnDropdown(false);
      }
      if (
        exportDropdownRef.current &&
        !exportDropdownRef.current.contains(target)
      ) {
        setShowExportDropdown(false);
      }
    };
    if (showColumnDropdown || showExportDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showColumnDropdown, showExportDropdown]);

  // Auto-dismiss export success message
  useEffect(() => {
    if (exportSuccessMessage) {
      const timer = setTimeout(() => {
        setExportSuccessMessage(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [exportSuccessMessage]);

  const handleToggleColumn = (colKey: string) => {
    setSelectedExportColumns((prev) => {
      if (prev.includes(colKey)) {
        if (prev.length === 1) {
          alert('You must select at least one column to export.');
          return prev;
        }
        return prev.filter((k) => k !== colKey);
      } else {
        return [...prev, colKey];
      }
    });
  };

  const handleSelectAllColumns = () => {
    if (selectedExportColumns.length === INVENTORY_EXPORT_COLUMNS.length) {
      setSelectedExportColumns([INVENTORY_EXPORT_COLUMNS[0].key]);
    } else {
      setSelectedExportColumns(INVENTORY_EXPORT_COLUMNS.map((c) => c.key));
    }
  };

  // Dynamic Export Handler (PDF and Excel ONLY)
  const handleDynamicExport = async (format: 'excel' | 'pdf') => {
    if (selectedExportColumns.length === 0) {
      alert('Please select at least one column to export.');
      return;
    }
    try {
      setExportingFormat(format);
      const blob = await inventoryApi.exportInventoryReport(format, {
        tabFilter: activeTab,
        search: searchQuery,
        status: statusFilter,
        columns: selectedExportColumns,
      });

      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      const filename = format === 'excel' ? 'inventory-report.xlsx' : 'inventory-report.pdf';
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      setExportSuccessMessage(`Downloaded ${filename} successfully (${selectedExportColumns.length} columns)`);
    } catch (err: any) {
      console.error(`Export ${format.toUpperCase()} error:`, err);
      alert(`Failed to export ${format.toUpperCase()}: ${err.message || 'Please check backend server'}`);
    } finally {
      setExportingFormat(null);
    }
  };

  // Pagination states
  const [itemsPage, setItemsPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [txnsPage, setTxnsPage] = useState(1);
  const [txnsPerPage, setTxnsPerPage] = useState(10);


  // Sync tab with URL query parameter (?tab=low-stock | ?tab=expiring-soon)
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'low-stock') {
      setActiveTab('LOW_STOCK');
    } else if (tabParam === 'expiring-soon') {
      setActiveTab('EXPIRING_SOON');
    } else if (tabParam === 'transactions') {
      setActiveTab('TRANSACTIONS');
    }
  }, [searchParams]);

  // Modal states
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [activeModal, setActiveModal] = useState<'RESTOCK' | 'WRITE_OFF' | 'ADJUST' | 'HISTORY' | null>(null);

  // Load Inventory Data
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await inventoryApi.getAllInventory();
      setItems(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  // Load Transactions Data
  const loadTransactions = async (type?: string) => {
    try {
      setLoading(true);
      const data = await inventoryApi.getTransactionHistory(type);
      setTransactions([...data].sort((a, b) => (b.txnId || 0) - (a.txnId || 0)));
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activeTab === 'TRANSACTIONS') {
      loadTransactions(txnTypeFilter);
    }
  }, [activeTab, txnTypeFilter]);

  // Handle modal success
  const handleModalSuccess = () => {
    setActiveModal(null);
    setSelectedItem(null);
    loadData();
    if (activeTab === 'TRANSACTIONS') {
      loadTransactions(txnTypeFilter);
    }
  };

  // Metrics calculation
  const totalStock = useMemo(() => items.reduce((sum, item) => sum + (item.quantity || 0), 0), [items]);
  const lowStockCount = useMemo(() => items.filter((item) => item.status === 'LOW_STOCK').length, [items]);
  const outOfStockCount = useMemo(() => items.filter((item) => item.status === 'OUT_OF_STOCK').length, [items]);
  const expiringSoonCount = useMemo(
    () => items.filter((item) => item.isPerishable && (item.expiryStatus === 'EXPIRING_SOON' || item.expiryStatus === 'EXPIRED')).length,
    [items]
  );
  const expiredCount = useMemo(
    () => items.filter((item) => item.isPerishable && item.expiryStatus === 'EXPIRED').length,
    [items]
  );

  // Filtered Items based on active tab, status, and search (latest first)
  const filteredItems = useMemo(() => {
    return [...items]
      .sort((a, b) => (b.inventoryId || 0) - (a.inventoryId || 0))
      .filter((item) => {
        const matchesSearch =
          (item.sku && item.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (item.productName && item.productName.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesStatus =
          statusFilter === 'ALL' || item.status === statusFilter;

        if (activeTab === 'LOW_STOCK') {
          return matchesSearch && matchesStatus && (item.status === 'LOW_STOCK' || item.status === 'OUT_OF_STOCK');
        }
        if (activeTab === 'EXPIRING_SOON') {
          return matchesSearch && matchesStatus && item.isPerishable && (item.expiryStatus === 'EXPIRING_SOON' || item.expiryStatus === 'EXPIRED');
        }
        return matchesSearch && matchesStatus;
      });
  }, [items, activeTab, searchQuery, statusFilter]);

  // Reset page on filter or tab change
  useEffect(() => {
    setItemsPage(1);
  }, [activeTab, searchQuery, statusFilter]);

  useEffect(() => {
    setTxnsPage(1);
  }, [txnTypeFilter]);

  // Paginated slices
  const paginatedItems = useMemo(() => {
    const start = (itemsPage - 1) * itemsPerPage;
    return filteredItems.slice(start, start + itemsPerPage);
  }, [filteredItems, itemsPage, itemsPerPage]);

  const paginatedTxns = useMemo(() => {
    const start = (txnsPage - 1) * txnsPerPage;
    return transactions.slice(start, start + txnsPerPage);
  }, [transactions, txnsPage, txnsPerPage]);


  return (
    <div className={styles.container}>
      {/* Page Top Header */}
      <div className={styles.pageTopHeader}>
        <div className={styles.headerLeft}>
          <div className={styles.iconBadge}>
            <FiBox />
          </div>
          <div>
            <h1 className={styles.mainTitle}>Stock Management</h1>
            <p className={styles.mainSubtitle}>
              Monitor real-time physical inventory, process restocks, write-offs, and audit trails
            </p>
          </div>
        </div>

        <div className={styles.headerActions}>
          <button className={styles.btnSecondary} onClick={loadData} disabled={loading}>
            <FiRefreshCw className={loading ? 'spin' : ''} size={14} /> Refresh
          </button>
        </div>
      </div>

      {error && <div className={styles.errorMessage}><FiAlertCircle /> {error}</div>}

      {/* Metrics Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statBlue}`}><FiPackage /></div>
          <div className={styles.statContent}>
            <h3>{items.length}</h3>
            <p>Tracked Variants</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statGreen}`}><FiBox /></div>
          <div className={styles.statContent}>
            <h3>{totalStock.toLocaleString()}</h3>
            <p>Total Units in Stock</p>
          </div>
        </div>

        <div className={styles.statCard} style={{ cursor: 'pointer' }} onClick={() => setActiveTab('LOW_STOCK')}>
          <div className={`${styles.statIcon} ${styles.statOrange}`}><FiAlertTriangle /></div>
          <div className={styles.statContent}>
            <h3>{lowStockCount}</h3>
            <p>Low Stock Alerts</p>
          </div>
        </div>

        <div className={styles.statCard} style={{ cursor: 'pointer' }} onClick={() => setActiveTab('LOW_STOCK')}>
          <div className={`${styles.statIcon} ${styles.statRed}`}><FiAlertCircle /></div>
          <div className={styles.statContent}>
            <h3>{outOfStockCount}</h3>
            <p>Out of Stock Items</p>
          </div>
        </div>

        <div
          className={styles.statCard}
          style={{
            cursor: 'pointer',
            borderLeft: expiringSoonCount > 0 ? (expiredCount > 0 ? '3px solid #ef4444' : '3px solid #f59e0b') : undefined,
          }}
          onClick={() => setActiveTab('EXPIRING_SOON')}
        >
          <div
            className={styles.statIcon}
            style={{
              background: expiredCount > 0 ? '#fef2f2' : '#fef3c7',
              color: expiredCount > 0 ? '#ef4444' : '#d97706',
            }}
          >
            <FiClock />
          </div>
          <div className={styles.statContent}>
            <h3 style={{ color: expiredCount > 0 ? '#ef4444' : undefined }}>{expiringSoonCount}</h3>
            <p>{expiredCount > 0 ? `${expiredCount} Expired!` : 'Expiring Soon'}</p>
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className={styles.controlsBar}>
        <div className={styles.tabs}>
          <button
            className={`${styles.tabBtn} ${activeTab === 'ALL' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('ALL')}
          >
            All Inventory ({items.length})
          </button>

          <button
            className={`${styles.tabBtn} ${activeTab === 'LOW_STOCK' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('LOW_STOCK')}
          >
            Low Stock Alerts
            {(lowStockCount + outOfStockCount > 0) && (
              <span className={styles.tabBadge}>{lowStockCount + outOfStockCount}</span>
            )}
          </button>

          <button
            className={`${styles.tabBtn} ${activeTab === 'EXPIRING_SOON' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('EXPIRING_SOON')}
          >
            <FiClock /> Expiring Soon
            {expiringSoonCount > 0 && (
              <span
                className={styles.tabBadge}
                style={{
                  background: expiredCount > 0 ? '#ef4444' : '#f59e0b',
                  color: '#ffffff',
                }}
              >
                {expiringSoonCount}
              </span>
            )}
          </button>

          <button
            className={`${styles.tabBtn} ${activeTab === 'TRANSACTIONS' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('TRANSACTIONS')}
          >
            <FiClock /> Audit History
          </button>
        </div>

        {activeTab !== 'TRANSACTIONS' ? (
          <div className={styles.filtersAndExports}>
            <div className={styles.searchBox}>
              <FiSearch color="#94a3b8" />
              <input
                type="text"
                placeholder="Search by SKU or Product..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={styles.statusSelect}
            >
              <option value="ALL">All Status</option>
              <option value="NORMAL">Normal</option>
              <option value="LOW_STOCK">Low Stock</option>
              <option value="OUT_OF_STOCK">Out of Stock</option>
            </select>

            {/* Column Selector Dropdown / Popover */}
            <div className={styles.columnSelectorContainer} ref={columnDropdownRef}>
              <button
                type="button"
                className={styles.btnColumnSelector}
                onClick={() => setShowColumnDropdown((prev) => !prev)}
                title="Select columns to export"
              >
                <FiSliders size={13} />
                <span>Columns ({selectedExportColumns.length}/9)</span>
                <FiChevronDown size={12} />
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
                      {selectedExportColumns.length === INVENTORY_EXPORT_COLUMNS.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                  <div className={styles.columnCheckboxList}>
                    {INVENTORY_EXPORT_COLUMNS.map((col) => (
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

            {/* Unified Export Dropdown Menu */}
            <div className={styles.exportDropdownContainer} ref={exportDropdownRef}>
              <button
                type="button"
                className={`${styles.btnExportDropdown} ${exportingFormat ? styles.btnExporting : ''}`}
                onClick={() => setShowExportDropdown((prev) => !prev)}
                disabled={!!exportingFormat || selectedExportColumns.length === 0}
                title="Export report as Excel or PDF"
              >
                {exportingFormat ? (
                  <>
                    <span className={styles.exportSpinner} />
                    <span>Exporting {exportingFormat.toUpperCase()}...</span>
                  </>
                ) : (
                  <>
                    <FiDownload size={13} />
                    <span>Export</span>
                    <FiChevronDown size={12} />
                  </>
                )}
              </button>

              {showExportDropdown && !exportingFormat && (
                <div className={styles.exportDropdownMenu}>
                  <div className={styles.exportDropdownHeader}>Export As</div>

                  <button
                    type="button"
                    className={styles.exportMenuItem}
                    onClick={() => {
                      setShowExportDropdown(false);
                      handleDynamicExport('excel');
                    }}
                  >
                    <div className={styles.exportMenuIconExcel}>
                      <FiFileText size={16} />
                    </div>
                    <div className={styles.exportMenuText}>
                      <span className={styles.exportMenuTitle}>Excel Document</span>
                      <span className={styles.exportMenuSub}>Spreadsheet (.xlsx)</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    className={styles.exportMenuItem}
                    onClick={() => {
                      setShowExportDropdown(false);
                      handleDynamicExport('pdf');
                    }}
                  >
                    <div className={styles.exportMenuIconPdf}>
                      <FiFileText size={16} />
                    </div>
                    <div className={styles.exportMenuText}>
                      <span className={styles.exportMenuTitle}>PDF Document</span>
                      <span className={styles.exportMenuSub}>Corporate Report (.pdf)</span>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: '#64748b' }}>Filter Type:</span>
            <select
              value={txnTypeFilter}
              onChange={(e) => setTxnTypeFilter(e.target.value)}
              style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            >
              <option value="ALL">All Transactions</option>
              <option value="RESTOCK">Restock</option>
              <option value="WRITE_OFF">Write-Off</option>
              <option value="ADJUSTMENT">Adjustment</option>
              <option value="INITIAL_STOCK">Initial Setup</option>
            </select>
          </div>
        )}
      </div>

      {exportSuccessMessage && (
        <div className={styles.exportSuccessBanner}>
          <FiCheckCircle size={15} />
          <span>{exportSuccessMessage}</span>
        </div>
      )}

      {/* Data Views */}
      <div className={styles.tableContainer}>
        {activeTab !== 'TRANSACTIONS' ? (
          <>
            <table className={styles.table}>

            <thead>
              <tr>
                <th>VARIANT & SKU</th>
                <th>PRODUCT</th>
                <th>SELLING PRICE</th>
                <th>PHYSICAL STOCK</th>
                <th>RESERVED</th>
                <th>AVAILABLE</th>
                <th>REORDER LEVEL</th>
                <th>EXPIRY &amp; BATCH</th>
                <th>STATUS</th>
                <th style={{ textAlign: 'center' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={10} className={styles.emptyState}>
                    <FiBox />
                    <p style={{ margin: '8px 0 16px 0', fontWeight: 500 }}>No inventory records found matching your filters.</p>
                    <button className={styles.btnPrimary} onClick={loadData}>
                      <FiRefreshCw /> Reload Stock Records
                    </button>
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item) => (
                  <tr key={item.inventoryId || item.variantId}>

                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <span className={styles.skuTag}>{item.sku}</span>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>#{item.variantId}</span>
                      </div>
                    </td>
                    <td>
                      <div className={styles.productCell}>
                        <div className={styles.productThumb}>
                          <FiPackage />
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: '#0f172a' }}>{item.productName || 'Unnamed'}</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>Variant ID #{item.variantId}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: '#0f172a' }}>
                        {(item.sellingPrice || 0).toLocaleString()} MMK
                      </span>
                    </td>
                    <td>
                      <div className={styles.stockBarContainer}>
                        <span style={{
                          fontWeight: 700,
                          fontSize: '14px',
                          color: (item.quantity || 0) === 0 ? '#ef4444' : (item.quantity || 0) <= (item.reorderLevel || 10) ? '#d97706' : '#0f172a'
                        }}>
                          {item.quantity ?? 0} units
                        </span>
                        <div className={styles.stockBarBg}>
                          <div
                            className={styles.stockBarFill}
                            style={{
                              width: `${Math.min(100, ((item.quantity || 0) / 40) * 100)}%`,
                              background: (item.quantity || 0) === 0 ? '#ef4444' : (item.quantity || 0) <= (item.reorderLevel || 10) ? '#f59e0b' : '#10b981'
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td style={{ color: '#64748b' }}>{item.reservedQuantity ?? 0}</td>
                    <td>
                      <span style={{ color: '#16a34a', fontWeight: 600 }}>
                        {item.availableQuantity ?? Math.max(0, (item.quantity || 0) - (item.reservedQuantity || 0))}
                      </span>
                    </td>
                    <td style={{ color: '#64748b' }}>{item.reorderLevel ?? 10} units</td>
                    <td>
                      {!item.isPerishable ? (
                        <span style={{ color: '#94a3b8', fontSize: '12px' }}>—</span>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          {item.expiryStatus === 'EXPIRED' && (
                            <span
                              style={{
                                background: '#fef2f2',
                                color: '#dc2626',
                                border: '1px solid #fecaca',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                fontSize: '11px',
                                fontWeight: 600,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                width: 'fit-content',
                              }}
                            >
                              <FiAlertCircle size={11} /> Expired ({Math.abs(item.daysUntilExpiry || 0)}d ago)
                            </span>
                          )}
                          {item.expiryStatus === 'EXPIRING_SOON' && (
                            <span
                              style={{
                                background: '#fffbeb',
                                color: '#d97706',
                                border: '1px solid #fde68a',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                fontSize: '11px',
                                fontWeight: 600,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                width: 'fit-content',
                              }}
                            >
                              <FiClock size={11} /> Expires in {item.daysUntilExpiry}d
                            </span>
                          )}
                          {item.expiryStatus === 'GOOD' && (
                            <span
                              style={{
                                background: '#ecfdf5',
                                color: '#059669',
                                border: '1px solid #a7f3d0',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                fontSize: '11px',
                                fontWeight: 600,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                width: 'fit-content',
                              }}
                            >
                              <FiCheckCircle size={11} /> Safe ({item.expiryDate})
                            </span>
                          )}
                          {item.batchNumber && (
                            <span style={{ fontSize: '11px', color: '#64748b' }}>
                              Batch: {item.batchNumber}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={`${styles.badge} ${
                        item.status === 'NORMAL' ? styles.badgeNormal :
                        item.status === 'LOW_STOCK' ? styles.badgeLowStock : styles.badgeOutOfStock
                      }`}>
                        {item.status === 'NORMAL' && <FiCheckCircle size={12} />}
                        {item.status === 'LOW_STOCK' && <FiAlertTriangle size={12} />}
                        {item.status === 'OUT_OF_STOCK' && <FiAlertCircle size={12} />}
                        {item.status === 'NORMAL' ? 'In Stock' : item.status === 'LOW_STOCK' ? 'Low Stock' : 'Out of Stock'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div className={styles.actionGroup}>
                        <button
                          className={`${styles.btnAction} ${styles.btnRestock}`}
                          title="Restock units"
                          onClick={() => { setSelectedItem(item); setActiveModal('RESTOCK'); }}
                        >
                          <FiPlusCircle size={13} /> Restock
                        </button>

                        <button
                          className={`${styles.btnAction} ${styles.btnWriteOff}`}
                          title="Write-off damaged units"
                          onClick={() => { setSelectedItem(item); setActiveModal('WRITE_OFF'); }}
                        >
                          <FiMinusCircle size={13} /> Write-off
                        </button>

                        <button
                          className={`${styles.btnAction} ${styles.btnAdjust}`}
                          title="Adjust count after physical audit"
                          onClick={() => { setSelectedItem(item); setActiveModal('ADJUST'); }}
                        >
                          <FiSliders size={13} /> Adjust
                        </button>

                        <button
                          className={`${styles.btnAction} ${styles.btnHistory}`}
                          title="Audit History"
                          onClick={() => { setSelectedItem(item); setActiveModal('HISTORY'); }}
                        >
                          <FiClock size={13} /> History
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {filteredItems.length > 0 && (
            <div style={{ padding: '0 16px 16px 16px' }}>
              <Pagination
                currentPage={itemsPage}
                totalPages={Math.ceil(filteredItems.length / itemsPerPage)}
                totalResults={filteredItems.length}
                pageSize={itemsPerPage}
                onPageChange={setItemsPage}
                onPageSizeChange={(size) => {
                  setItemsPerPage(size);
                  setItemsPage(1);
                }}
              />
            </div>
          )}
        </>
        ) : (
          /* Audit History Tab */
          <>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>SKU</th>
                <th>Product</th>
                <th>Type</th>
                <th>Change</th>
                <th>Before &rarr; After</th>
                <th>Initiated By</th>
                <th>Reference</th>
                <th>Remark</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={9} className={styles.emptyState}>
                    <FiClock />
                    <p>No inventory transactions recorded yet.</p>
                  </td>
                </tr>
              ) : (
                paginatedTxns.map((t) => (
                  <tr key={t.txnId}>
                    <td style={{ fontSize: '13px', color: '#64748b' }}>
                      {new Date(t.createdAt).toLocaleString()}
                    </td>
                    <td><span className={styles.skuTag}>{t.sku}</span></td>
                    <td style={{ fontWeight: 600 }}>{t.productName}</td>
                    <td>
                      <span className={`${styles.badge} ${
                        t.txnType === 'RESTOCK' ? styles.badgeNormal :
                        (t.txnType === 'WRITE_OFF' || t.txnType === 'SALE') ? styles.badgeOutOfStock : styles.badgeLowStock
                      }`}>
                        {t.txnType}
                      </span>

                    </td>
                    <td style={{ fontWeight: 700, color: t.qty > 0 ? '#16a34a' : '#dc2626' }}>
                      {t.qty > 0 ? `+${t.qty}` : t.qty}
                    </td>
                    <td>{t.beforeQty} &rarr; {t.afterQty}</td>
                    <td>{t.createdByName || 'System'}</td>
                    <td style={{ fontSize: '12px', color: '#64748b' }}>
                      {t.referenceType ? `${t.referenceType} ${t.referenceId ? `#${t.referenceId}` : ''}` : '-'}
                    </td>
                    <td style={{ fontSize: '13px' }}>{t.remark || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {transactions.length > 0 && (
            <div style={{ padding: '0 16px 16px 16px' }}>
              <Pagination
                currentPage={txnsPage}
                totalPages={Math.ceil(transactions.length / txnsPerPage)}
                totalResults={transactions.length}
                pageSize={txnsPerPage}
                onPageChange={setTxnsPage}
                onPageSizeChange={(size) => {
                  setTxnsPerPage(size);
                  setTxnsPage(1);
                }}
              />
            </div>
          )}
        </>
        )}
      </div>


      {/* Render Action Modals */}
      {activeModal === 'RESTOCK' && selectedItem && (
        <RestockModal
          item={selectedItem}
          onClose={() => setActiveModal(null)}
          onSuccess={handleModalSuccess}
        />
      )}

      {activeModal === 'WRITE_OFF' && selectedItem && (
        <WriteOffModal
          item={selectedItem}
          onClose={() => setActiveModal(null)}
          onSuccess={handleModalSuccess}
        />
      )}

      {activeModal === 'ADJUST' && selectedItem && (
        <AdjustModal
          item={selectedItem}
          onClose={() => setActiveModal(null)}
          onSuccess={handleModalSuccess}
        />
      )}

      {activeModal === 'HISTORY' && selectedItem && (
        <VariantHistoryModal
          item={selectedItem}
          onClose={() => setActiveModal(null)}
        />
      )}
    </div>
  );
};
