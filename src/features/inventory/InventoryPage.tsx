import React, { useState, useEffect, useMemo } from 'react';
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

export const InventoryPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [activeTab, setActiveTab] = useState<'ALL' | 'LOW_STOCK' | 'TRANSACTIONS'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [txnTypeFilter, setTxnTypeFilter] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync tab with URL query parameter (?tab=low-stock)
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'low-stock') {
      setActiveTab('LOW_STOCK');
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

  // CSV Export
  const handleExportCsv = () => {
    if (items.length === 0) {
      alert('No inventory data to export');
      return;
    }
    const headers = ['Variant ID', 'SKU', 'Product Name', 'Price (MMK)', 'Physical Qty', 'Reserved', 'Available', 'Reorder Level', 'Status'];
    const rows = filteredItems.map((item) => [
      item.variantId,
      `"${item.sku || ''}"`,
      `"${item.productName || ''}"`,
      item.sellingPrice || 0,
      item.quantity || 0,
      item.reservedQuantity || 0,
      item.availableQuantity || 0,
      item.reorderLevel || 10,
      item.status || 'NORMAL',
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `inventory_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
        return matchesSearch && matchesStatus;
      });
  }, [items, activeTab, searchQuery, statusFilter]);

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
          <button className={styles.btnExportCsv} onClick={handleExportCsv}>
            <FiDownload size={14} /> Export CSV
          </button>
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
            className={`${styles.tabBtn} ${activeTab === 'TRANSACTIONS' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('TRANSACTIONS')}
          >
            <FiClock /> Audit History
          </button>
        </div>

        {activeTab !== 'TRANSACTIONS' ? (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
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
              style={{
                padding: '7px 12px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                background: '#f8fafc',
                fontSize: '13px',
                color: '#334155',
                outline: 'none',
              }}
            >
              <option value="ALL">All Status</option>
              <option value="NORMAL">Normal</option>
              <option value="LOW_STOCK">Low Stock</option>
              <option value="OUT_OF_STOCK">Out of Stock</option>
            </select>
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

      {/* Data Views */}
      <div className={styles.tableContainer}>
        {activeTab !== 'TRANSACTIONS' ? (
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
                <th>STATUS</th>
                <th style={{ textAlign: 'center' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className={styles.emptyState}>
                    <FiBox />
                    <p style={{ margin: '8px 0 16px 0', fontWeight: 500 }}>No inventory records found matching your filters.</p>
                    <button className={styles.btnPrimary} onClick={loadData}>
                      <FiRefreshCw /> Reload Stock Records
                    </button>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
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
        ) : (
          /* Audit History Tab */
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
                transactions.map((t) => (
                  <tr key={t.txnId}>
                    <td style={{ fontSize: '13px', color: '#64748b' }}>
                      {new Date(t.createdAt).toLocaleString()}
                    </td>
                    <td><span className={styles.skuTag}>{t.sku}</span></td>
                    <td style={{ fontWeight: 600 }}>{t.productName}</td>
                    <td>
                      <span className={`${styles.badge} ${
                        t.txnType === 'RESTOCK' ? styles.badgeNormal :
                        t.txnType === 'WRITE_OFF' ? styles.badgeOutOfStock : styles.badgeLowStock
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
