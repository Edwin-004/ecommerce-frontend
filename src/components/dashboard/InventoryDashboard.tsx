import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiPackage,
  FiAlertTriangle,
  FiSlash,
  FiClock,
  FiArrowRight,
  FiCheckCircle,
} from 'react-icons/fi';
import { inventoryApi } from '../../features/inventory/inventoryApi';
import type { InventoryItem, InventoryTransaction } from '../../types/inventory';
import styles from './InventoryDashboard.module.css';

export const InventoryDashboard: React.FC = () => {
  const navigate = useNavigate();

  const [, setLoading] = useState<boolean>(true);
  const [inventoryList, setInventoryList] = useState<InventoryItem[]>([]);
  const [lowStockList, setLowStockList] = useState<InventoryItem[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [invData, lowData, txData] = await Promise.allSettled([
        inventoryApi.getAllInventory(),
        inventoryApi.getLowStockAlerts(),
        inventoryApi.getTransactionHistory('ALL'),
      ]);

      if (invData.status === 'fulfilled') setInventoryList(invData.value || []);
      if (lowData.status === 'fulfilled') setLowStockList(lowData.value || []);
      if (txData.status === 'fulfilled') setTransactions(txData.value?.slice(0, 8) || []);
    } catch (err) {
      console.error('Error loading inventory dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Listen to Global Topbar Refresh Event
  useEffect(() => {
    const handleGlobalRefresh = () => {
      fetchData();
    };
    window.addEventListener('admin:refresh', handleGlobalRefresh);
    return () => window.removeEventListener('admin:refresh', handleGlobalRefresh);
  }, []);

  // Compute Metrics
  const totalVariants = inventoryList.length;
  const outOfStockCount = useMemo(
    () => inventoryList.filter((item) => (item.availableQuantity ?? item.quantity ?? 0) <= 0).length,
    [inventoryList]
  );
  const lowStockCount = lowStockList.length;

  // Batch expiry counts
  const expiringSoonCount = useMemo(() => {
    const now = new Date();
    const thirtyDaysAhead = new Date();
    thirtyDaysAhead.setDate(now.getDate() + 30);

    return inventoryList.filter((item) => {
      if (!item.batchNumber || !item.expiryDate) return false;
      const exp = new Date(item.expiryDate);
      return !isNaN(exp.getTime()) && exp <= thirtyDaysAhead;
    }).length;
  }, [inventoryList]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  };

  const getTxnBadgeStyle = (txnType?: string) => {
    const t = (txnType || '').toUpperCase();
    if (t === 'RESTOCK') return { bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' };
    if (t === 'WRITE_OFF') return { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' };
    if (t === 'SALE') return { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' };
    if (t === 'RETURN') return { bg: '#faf5ff', color: '#7c3aed', border: '#e9d5ff' };
    return { bg: '#fffbeb', color: '#d97706', border: '#fde68a' };
  };

  return (
    <div className={styles.dashboardContainer}>
      {/* 1. Header Section (Refresh button removed since topbar already has it) */}
      <div className={styles.headerSection}>
        <div className={styles.headerLeft}>
          <div className={styles.headerTitleRow}>
            <div className={styles.headerIconBadge}>
              <FiPackage size={18} />
            </div>
            <h1 className={styles.headerTitle}>Inventory &amp; Stock Operations</h1>
          </div>
          <p className={styles.headerSubtitle}>
            Real-time stock valuation, SKU health, reorder alerts, and batch tracking
          </p>
        </div>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={() => navigate('/admin/inventory')}
          >
            <FiPackage size={14} /> Manage Inventory
          </button>
        </div>
      </div>

      {/* 2. Top 4 Clean KPI Stat Cards */}
      <div className={styles.statsGrid}>
        {/* Card 1: Total Active SKUs */}
        <div
          className={styles.statCard}
          onClick={() => navigate('/admin/inventory')}
          title="View active catalog inventory"
        >
          <div className={styles.statTopRow}>
            <span className={styles.statLabel}>Active Catalog</span>
            <span className={`${styles.pillBadge} ${styles.pillBlue}`}>
              <span className={`${styles.statDot} ${styles.dotBlue}`} /> Monitored
            </span>
          </div>
          <div className={styles.statValue}>
            {totalVariants}
          </div>
          <div className={styles.statBottomRow}>
            <span className={`${styles.statTrend} ${styles.statTrendBlue}`}>
              <FiPackage size={12} /> {totalVariants} trackable SKU{totalVariants === 1 ? '' : 's'}
            </span>
            <div className={`${styles.statIconBox} ${styles.iconBlue}`}>
              <FiPackage size={14} />
            </div>
          </div>
        </div>

        {/* Card 2: Low Stock Alerts */}
        <div
          className={styles.statCard}
          style={lowStockCount > 0 ? { borderColor: 'rgba(245, 158, 11, 0.6)' } : undefined}
          onClick={() => navigate('/admin/inventory')}
          title="Items requiring stock replenishment"
        >
          <div className={styles.statTopRow}>
            <span className={styles.statLabel}>Low Stock Alerts</span>
            {lowStockCount > 0 ? (
              <span className={`${styles.pillBadge} ${styles.pillAmber}`}>
                <span className={`${styles.statDot} ${styles.dotAmber}`} /> Reorder Needed
              </span>
            ) : (
              <span className={`${styles.pillBadge} ${styles.pillGreen}`}>
                <span className={`${styles.statDot} ${styles.dotGreen}`} /> Optimal
              </span>
            )}
          </div>
          <div
            className={styles.statValue}
            style={lowStockCount > 0 ? { color: '#d97706' } : undefined}
          >
            {lowStockCount}
          </div>
          <div className={styles.statBottomRow}>
            {lowStockCount > 0 ? (
              <span className={`${styles.statTrend} ${styles.statTrendAmber}`}>
                <FiAlertTriangle size={12} /> Requires replenishment
              </span>
            ) : (
              <span className={`${styles.statTrend} ${styles.statTrendGreen}`}>
                <FiCheckCircle size={12} /> Stock levels healthy
              </span>
            )}
            <div className={`${styles.statIconBox} ${styles.iconAmber}`}>
              <FiAlertTriangle size={14} />
            </div>
          </div>
        </div>

        {/* Card 3: Out of Stock */}
        <div
          className={styles.statCard}
          style={outOfStockCount > 0 ? { borderColor: 'rgba(239, 68, 68, 0.6)' } : undefined}
          onClick={() => navigate('/admin/inventory')}
          title="Items currently out of stock"
        >
          <div className={styles.statTopRow}>
            <span className={styles.statLabel}>Out of Stock</span>
            {outOfStockCount > 0 ? (
              <span className={`${styles.pillBadge} ${styles.pillRed}`}>
                <span className={`${styles.statDot} ${styles.dotRed}`} /> Critical
              </span>
            ) : (
              <span className={`${styles.pillBadge} ${styles.pillGreen}`}>
                <span className={`${styles.statDot} ${styles.dotGreen}`} /> All In Stock
              </span>
            )}
          </div>
          <div
            className={styles.statValue}
            style={outOfStockCount > 0 ? { color: '#dc2626' } : undefined}
          >
            {outOfStockCount}
          </div>
          <div className={styles.statBottomRow}>
            {outOfStockCount > 0 ? (
              <span className={`${styles.statTrend} ${styles.statTrendRed}`}>
                <FiSlash size={12} /> Immediate restock required
              </span>
            ) : (
              <span className={`${styles.statTrend} ${styles.statTrendGreen}`}>
                <FiCheckCircle size={12} /> Zero stockouts detected
              </span>
            )}
            <div className={`${styles.statIconBox} ${outOfStockCount > 0 ? styles.iconRed : styles.iconGreen}`}>
              <FiSlash size={14} />
            </div>
          </div>
        </div>

        {/* Card 4: Expiring Soon */}
        <div
          className={styles.statCard}
          style={expiringSoonCount > 0 ? { borderColor: 'rgba(234, 88, 12, 0.6)' } : undefined}
          onClick={() => navigate('/admin/inventory')}
          title="Batches approaching expiration date"
        >
          <div className={styles.statTopRow}>
            <span className={styles.statLabel}>Expiring Soon</span>
            {expiringSoonCount > 0 ? (
              <span className={`${styles.pillBadge} ${styles.pillOrange}`}>
                <span className={`${styles.statDot} ${styles.dotOrange}`} /> &lt; 30 Days
              </span>
            ) : (
              <span className={`${styles.pillBadge} ${styles.pillGreen}`}>
                <span className={`${styles.statDot} ${styles.dotGreen}`} /> Fresh
              </span>
            )}
          </div>
          <div className={styles.statValue}>
            {expiringSoonCount}
          </div>
          <div className={styles.statBottomRow}>
            {expiringSoonCount > 0 ? (
              <span className={`${styles.statTrend} ${styles.statTrendOrange}`}>
                <FiClock size={12} /> Batches expiring soon
              </span>
            ) : (
              <span className={`${styles.statTrend} ${styles.statTrendNeutral}`}>
                <FiCheckCircle size={12} /> No expiring batches
              </span>
            )}
            <div className={`${styles.statIconBox} ${styles.iconOrange}`}>
              <FiClock size={14} />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main 2 Columns: Low Stock Attention List + Recent Transactions */}
      <div className={styles.mainGrid}>
        {/* Left Card: Low & Critical Stock Attention */}
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitleGroup}>
              <div className={`${styles.sectionIconBadge} ${styles.iconBadgeAmber}`}>
                <FiAlertTriangle size={16} />
              </div>
              <div>
                <h3 className={styles.sectionTitle}>Low &amp; Critical Stock Attention</h3>
                <p className={styles.sectionSubtitle}>
                  Items below threshold that require immediate replenishment
                </p>
              </div>
            </div>
            <button
              type="button"
              className={styles.headerLinkBtn}
              onClick={() => navigate('/admin/inventory')}
            >
              View All ({lowStockList.length}) <FiArrowRight size={13} />
            </button>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Product / SKU</th>
                  <th style={{ textAlign: 'center' }}>In Stock</th>
                  <th style={{ textAlign: 'center' }}>Reorder Level</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {lowStockList.length > 0 ? (
                  lowStockList.slice(0, 6).map((item, idx) => {
                    const currentQty = item.availableQuantity ?? item.quantity ?? 0;
                    const reorderLevel = item.reorderLevel ?? 10;
                    const isOut = currentQty <= 0;

                    return (
                      <tr key={item.inventoryId || idx}>
                        <td>
                          <div className={styles.productName}>
                            {item.productName || (item as unknown as { variant?: { product?: { name?: string } } }).variant?.product?.name || 'Product'}
                          </div>
                          <div className={styles.skuTag}>
                            SKU: {item.sku || (item as unknown as { variant?: { skuCode?: string } }).variant?.skuCode || '—'}
                          </div>
                        </td>
                        <td
                          className={styles.unitsCell}
                          style={{
                            textAlign: 'center',
                            color: isOut ? '#dc2626' : '#d97706',
                          }}
                        >
                          {currentQty} units
                        </td>
                        <td
                          className={styles.unitsCell}
                          style={{ textAlign: 'center', color: '#64748b' }}
                        >
                          {reorderLevel} units
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span
                            className={`${styles.statusBadge} ${isOut ? styles.statusOutOfStock : styles.statusLowStock}`}
                          >
                            {isOut ? 'OUT OF STOCK' : 'LOW STOCK'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            className={styles.actionBtn}
                            onClick={() => navigate('/admin/inventory')}
                            title="Restock this item"
                          >
                            Restock
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5}>
                      <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>
                          <FiCheckCircle size={22} />
                        </div>
                        <h4 className={styles.emptyTitle}>All stock levels are healthy!</h4>
                        <p className={styles.emptyDesc}>
                          No low stock or out-of-stock items detected.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Card: Recent Stock Adjustments / Activity */}
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitleGroup}>
              <div className={`${styles.sectionIconBadge} ${styles.iconBadgeBlue}`}>
                <FiClock size={16} />
              </div>
              <div>
                <h3 className={styles.sectionTitle}>Recent Stock Activity</h3>
                <p className={styles.sectionSubtitle}>
                  Latest inventory ledger entries
                </p>
              </div>
            </div>
            <button
              type="button"
              className={styles.headerLinkBtn}
              onClick={() => navigate('/admin/inventory')}
            >
              View Ledger <FiArrowRight size={13} />
            </button>
          </div>

          <div className={styles.activityList}>
            {transactions.length > 0 ? (
              transactions.map((tx, idx) => {
                const txnType = tx.txnType || (tx as unknown as { transactionType?: string }).transactionType || 'ADJUST';
                const isRestock = txnType === 'RESTOCK' || txnType === 'RETURN';
                const isDeduction = txnType === 'WRITE_OFF' || txnType === 'SALE';
                const changeAmount = tx.qty ?? (tx as unknown as { quantityChange?: number }).quantityChange ?? 0;
                const isPositive = isRestock || (!isDeduction && changeAmount > 0);
                const badgeStyle = getTxnBadgeStyle(txnType);

                return (
                  <div key={tx.txnId || (tx as unknown as { transactionId?: number }).transactionId || idx} className={styles.activityItem}>
                    <div className={styles.activityLeft}>
                      <div className={styles.activityTopRow}>
                        <span
                          className={styles.activityBadge}
                          style={{
                            background: badgeStyle.bg,
                            color: badgeStyle.color,
                            border: `1px solid ${badgeStyle.border}`,
                          }}
                        >
                          {txnType}
                        </span>
                        <span className={styles.activityName}>
                          {tx.productName || 'Inventory Item'}
                        </span>
                      </div>
                      <div className={styles.activityMeta}>
                        SKU: {tx.sku || (tx as unknown as { variant?: { skuCode?: string } }).variant?.skuCode || '—'} • {formatDate(tx.createdAt)}
                      </div>
                    </div>

                    <div
                      className={`${styles.activityQty} ${isPositive ? styles.qtyPositive : isDeduction ? styles.qtyNegative : styles.qtyNeutral}`}
                    >
                      {isPositive ? `+${changeAmount}` : isDeduction ? `-${changeAmount}` : changeAmount} units
                    </div>
                  </div>
                );
              })
            ) : (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                  <FiCheckCircle size={22} />
                </div>
                <h4 className={styles.emptyTitle}>No recent activity</h4>
                <p className={styles.emptyDesc}>
                  Stock ledger logs will appear here when inventory is updated.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
