import React, { useState, useEffect, useMemo } from 'react';
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
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [activeTab, setActiveTab] = useState<'ALL' | 'LOW_STOCK' | 'TRANSACTIONS'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [txnTypeFilter, setTxnTypeFilter] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setTransactions(data);
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

  // Filtered Items based on active tab and search
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        (item.sku && item.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.productName && item.productName.toLowerCase().includes(searchQuery.toLowerCase()));

      if (activeTab === 'LOW_STOCK') {
        return matchesSearch && (item.status === 'LOW_STOCK' || item.status === 'OUT_OF_STOCK');
      }
      return matchesSearch;
    });
  }, [items, activeTab, searchQuery]);

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Inventory & Stock Management</h1>
          <p className={styles.subtitle}>
            Monitor variant stock levels, handle restocks, log write-offs, and track inventory audits
          </p>
        </div>

        <div className={styles.headerActions}>
          <button className={styles.btnSecondary} onClick={loadData} disabled={loading}>
            <FiRefreshCw className={loading ? 'spin' : ''} /> Refresh
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
          <div className={styles.searchBox}>
            <FiSearch color="#94a3b8" />
            <input
              type="text"
              placeholder="Search by SKU or Product..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
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
                <th>Variant ID</th>
                <th>SKU</th>
                <th>Product Name</th>
                <th>Selling Price</th>
                <th>Physical Qty</th>
                <th>Reserved</th>
                <th>Available</th>
                <th>Reorder Level</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={10} className={styles.emptyState}>
                    <FiBox />
                    <p>No inventory records found.</p>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.inventoryId || item.variantId}>
                    <td style={{ color: '#64748b' }}>#{item.variantId}</td>
                    <td><span className={styles.skuTag}>{item.sku}</span></td>
                    <td style={{ fontWeight: 600 }}>{item.productName || '-'}</td>
                    <td>{item.sellingPrice ? `$${item.sellingPrice.toFixed(2)}` : '-'}</td>
                    <td style={{ fontWeight: 700, fontSize: '15px' }}>{item.quantity}</td>
                    <td style={{ color: '#64748b' }}>{item.reservedQuantity}</td>
                    <td style={{ color: '#16a34a', fontWeight: 600 }}>{item.availableQuantity}</td>
                    <td style={{ color: '#64748b' }}>{item.reorderLevel} units</td>
                    <td>
                      <span className={`${styles.badge} ${
                        item.status === 'NORMAL' ? styles.badgeNormal :
                        item.status === 'LOW_STOCK' ? styles.badgeLowStock : styles.badgeOutOfStock
                      }`}>
                        {item.status === 'NORMAL' && <FiCheckCircle />}
                        {item.status === 'LOW_STOCK' && <FiAlertTriangle />}
                        {item.status === 'OUT_OF_STOCK' && <FiAlertCircle />}
                        {item.status}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actionGroup}>
                        <button
                          className={`${styles.btnAction} ${styles.btnRestock}`}
                          title="Restock"
                          onClick={() => { setSelectedItem(item); setActiveModal('RESTOCK'); }}
                        >
                          <FiPlusCircle /> Restock
                        </button>

                        <button
                          className={`${styles.btnAction} ${styles.btnWriteOff}`}
                          title="Write-off damaged goods"
                          onClick={() => { setSelectedItem(item); setActiveModal('WRITE_OFF'); }}
                        >
                          <FiMinusCircle /> Write-off
                        </button>

                        <button
                          className={`${styles.btnAction} ${styles.btnAdjust}`}
                          title="Adjust count"
                          onClick={() => { setSelectedItem(item); setActiveModal('ADJUST'); }}
                        >
                          <FiSliders /> Adjust
                        </button>

                        <button
                          className={`${styles.btnAction} ${styles.btnHistory}`}
                          title="Audit Trail"
                          onClick={() => { setSelectedItem(item); setActiveModal('HISTORY'); }}
                        >
                          <FiClock /> History
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
