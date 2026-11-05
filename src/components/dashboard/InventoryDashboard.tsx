import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiPackage,
  FiAlertTriangle,
  FiSlash,
  FiClock,
  FiPlus,
  FiArrowRight,
  FiLayers,
  FiTrendingUp,
  FiRefreshCw,
  FiCheckCircle,
} from 'react-icons/fi';
import { inventoryApi } from '../../features/inventory/inventoryApi';
import { productManagementApi, type ProductItem } from '../../features/products/productManagementApi';
import type { InventoryItem, InventoryTransaction } from '../../types/inventory';
import styles from '../AdminDashboard.module.css';

export const InventoryDashboard: React.FC = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState<boolean>(true);
  const [inventoryList, setInventoryList] = useState<InventoryItem[]>([]);
  const [lowStockList, setLowStockList] = useState<InventoryItem[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [invData, lowData, prodData, txData] = await Promise.allSettled([
        inventoryApi.getAllInventory(),
        inventoryApi.getLowStockAlerts(),
        productManagementApi.getProducts(),
        inventoryApi.getTransactionHistory('ALL'),
      ]);

      if (invData.status === 'fulfilled') setInventoryList(invData.value || []);
      if (lowData.status === 'fulfilled') setLowStockList(lowData.value || []);
      if (prodData.status === 'fulfilled') setProducts(prodData.value || []);
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

  // Compute Metrics
  const totalVariants = inventoryList.length;
  const outOfStockCount = useMemo(
    () => inventoryList.filter((item) => (item.availableQuantity ?? item.quantity ?? 0) <= 0).length,
    [inventoryList]
  );
  const lowStockCount = lowStockList.length;

  const totalPhysicalUnits = useMemo(
    () => inventoryList.reduce((acc, item) => acc + (item.quantity || 0), 0),
    [inventoryList]
  );

  const totalValuation = useMemo(() => {
    return inventoryList.reduce((acc, item) => {
      const price = Number(item.variant?.price) || 0;
      const qty = item.quantity || 0;
      return acc + price * qty;
    }, 0);
  }, [inventoryList]);

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

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US').format(Math.round(val)) + ' MMK';
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className={styles.dashboardContainer}>
      {/* Header */}
      <div className={styles.headerSection}>
        <div className={styles.headerLeft}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>📦</span>
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
            onClick={() => navigate('/admin/products/new')}
          >
            <FiPlus size={16} /> Add Product
          </button>
          <button
            type="button"
            className={styles.primaryBtn}
            style={{ background: '#059669' }}
            onClick={() => navigate('/admin/inventory')}
          >
            <FiPackage size={16} /> Manage Inventory
          </button>
          <button
            type="button"
            className={styles.chartToggleBtn}
            onClick={fetchData}
            title="Refresh Stock Data"
          >
            <FiRefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Top 4 KPI Cards */}
      <div className={styles.statsGrid}>
        {/* Card 1: Total SKUs */}
        <div className={styles.statCard} onClick={() => navigate('/admin/variants')}>
          <div className={styles.cardHeader}>
            <div className={`${styles.iconWrap} ${styles.iconWrapBlue}`}>
              <FiPackage size={20} />
            </div>
            <span className={styles.cardTrendNeutral}>Active SKUs</span>
          </div>
          <div className={styles.cardBottom}>
            <p className={styles.cardLabel}>Total Variants &amp; SKUs</p>
            <h3 className={styles.cardValue}>{totalVariants}</h3>
          </div>
        </div>

        {/* Card 2: Low Stock Warnings */}
        <div
          className={styles.statCard}
          style={lowStockCount > 0 ? { borderColor: 'rgba(245, 158, 11, 0.6)' } : {}}
          onClick={() => navigate('/admin/inventory')}
        >
          <div className={styles.cardHeader}>
            <div className={`${styles.iconWrap} ${styles.iconWrapAmber}`}>
              <FiAlertTriangle size={20} />
            </div>
            <span
              className={styles.cardTrendWarning}
              style={{ background: 'rgba(254, 243, 199, 0.8)', color: '#b45309' }}
            >
              Reorder Needed
            </span>
          </div>
          <div className={styles.cardBottom}>
            <p className={styles.cardLabel}>Low Stock Alerts</p>
            <h3 className={styles.cardValue} style={lowStockCount > 0 ? { color: '#d97706' } : {}}>
              {lowStockCount}
            </h3>
          </div>
        </div>

        {/* Card 3: Out of Stock */}
        <div
          className={styles.statCard}
          style={outOfStockCount > 0 ? { borderColor: 'rgba(239, 68, 68, 0.6)' } : {}}
          onClick={() => navigate('/admin/inventory')}
        >
          <div className={styles.cardHeader}>
            <div className={`${styles.iconWrap} ${styles.iconWrapRose}`}>
              <FiSlash size={20} />
            </div>
            <span
              className={styles.cardTrendDanger}
              style={{ background: 'rgba(254, 226, 226, 0.8)', color: '#b91c1c' }}
            >
              Critical
            </span>
          </div>
          <div className={styles.cardBottom}>
            <p className={styles.cardLabel}>Out of Stock</p>
            <h3 className={styles.cardValue} style={outOfStockCount > 0 ? { color: '#dc2626' } : {}}>
              {outOfStockCount}
            </h3>
          </div>
        </div>

        {/* Card 4: Expiring Soon */}
        <div
          className={styles.statCard}
          style={expiringSoonCount > 0 ? { borderColor: 'rgba(234, 88, 12, 0.6)' } : {}}
          onClick={() => navigate('/admin/inventory')}
        >
          <div className={styles.cardHeader}>
            <div
              className={styles.iconWrap}
              style={{ background: 'rgba(255, 237, 213, 0.8)', color: '#c2410c' }}
            >
              <FiClock size={20} />
            </div>
            <span
              className={styles.cardTrendWarning}
              style={{ background: 'rgba(255, 247, 237, 0.9)', color: '#c2410c' }}
            >
              &lt; 30 Days
            </span>
          </div>
          <div className={styles.cardBottom}>
            <p className={styles.cardLabel}>Expiring Batches</p>
            <h3 className={styles.cardValue}>{expiringSoonCount}</h3>
          </div>
        </div>
      </div>

      {/* Stock Health & Valuation Highlights Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          color: '#ffffff',
          borderRadius: '16px',
          padding: '24px 28px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '28px',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.25)',
        }}
      >
        <div>
          <span
            style={{
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              fontSize: '11px',
              fontWeight: 600,
              color: '#94a3b8',
            }}
          >
            Warehouse Stock Valuation
          </span>
          <h2 style={{ fontSize: '26px', fontWeight: 700, margin: '6px 0 2px 0', color: '#38bdf8' }}>
            {formatCurrency(totalValuation)}
          </h2>
          <p style={{ margin: 0, fontSize: '12.5px', color: '#cbd5e1' }}>
            Total physical inventory units on shelf:{' '}
            <strong style={{ color: '#ffffff' }}>{totalPhysicalUnits.toLocaleString()} units</strong>
          </p>
        </div>

        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              padding: '12px 18px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.12)',
            }}
          >
            <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>
              Catalog Products
            </p>
            <p style={{ margin: '4px 0 0 0', fontSize: '18px', fontWeight: 700, color: '#f8fafc' }}>
              {products.length} Products
            </p>
          </div>

          <div
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              padding: '12px 18px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.12)',
            }}
          >
            <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>
              Stock Availability Rate
            </p>
            <p style={{ margin: '4px 0 0 0', fontSize: '18px', fontWeight: 700, color: '#4ade80' }}>
              {totalVariants > 0
                ? `${Math.round(((totalVariants - outOfStockCount) / totalVariants) * 100)}%`
                : '100%'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Two Columns: Low Stock Attention List + Recent Transactions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '20px' }}>
        {/* Left Column: Low Stock Items Table */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid rgba(226, 232, 240, 0.9)',
            padding: '20px 24px',
            boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.04)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
            }}
          >
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
                ⚠️ Low &amp; Critical Stock Attention
              </h3>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0 0' }}>
                Items below threshold that require immediate replenishment
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/admin/inventory')}
              style={{
                fontSize: '12px',
                color: '#2563eb',
                fontWeight: 500,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              View All ({lowStockList.length}) <FiArrowRight size={13} />
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left' }}>
                  <th style={{ padding: '10px 8px', fontWeight: 600 }}>Product / SKU</th>
                  <th style={{ padding: '10px 8px', fontWeight: 600, textAlign: 'center' }}>In Stock</th>
                  <th style={{ padding: '10px 8px', fontWeight: 600, textAlign: 'center' }}>Reorder Level</th>
                  <th style={{ padding: '10px 8px', fontWeight: 600, textAlign: 'center' }}>Status</th>
                  <th style={{ padding: '10px 8px', fontWeight: 600, textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {lowStockList.length > 0 ? (
                  lowStockList.slice(0, 6).map((item, idx) => {
                    const currentQty = item.availableQuantity ?? item.quantity ?? 0;
                    const reorderLevel = item.reorderLevel ?? 10;
                    const isOut = currentQty <= 0;

                    return (
                      <tr
                        key={item.inventoryId || idx}
                        style={{
                          borderBottom: '1px solid #f1f5f9',
                          transition: 'background 0.15s ease',
                        }}
                      >
                        <td style={{ padding: '12px 8px' }}>
                          <div style={{ fontWeight: 600, color: '#1e293b' }}>
                            {item.variant?.product?.name || item.productName || 'Product'}
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>
                            SKU: {item.variant?.skuCode || item.skuCode || '—'}
                          </div>
                        </td>
                        <td
                          style={{
                            padding: '12px 8px',
                            textAlign: 'center',
                            fontWeight: 700,
                            color: isOut ? '#dc2626' : '#d97706',
                          }}
                        >
                          {currentQty} units
                        </td>
                        <td style={{ padding: '12px 8px', textAlign: 'center', color: '#64748b' }}>
                          {reorderLevel} units
                        </td>
                        <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              borderRadius: '9999px',
                              fontSize: '11px',
                              fontWeight: 600,
                              background: isOut ? '#fee2e2' : '#fef3c7',
                              color: isOut ? '#991b1b' : '#92400e',
                            }}
                          >
                            {isOut ? 'OUT OF STOCK' : 'LOW STOCK'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={() => navigate('/admin/inventory')}
                            style={{
                              padding: '5px 12px',
                              fontSize: '11.5px',
                              fontWeight: 500,
                              color: '#ffffff',
                              background: '#2563eb',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                            }}
                          >
                            Restock
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} style={{ padding: '32px 0', textAlign: 'center', color: '#10b981' }}>
                      <FiCheckCircle size={28} style={{ margin: '0 auto 8px auto', display: 'block' }} />
                      <div style={{ fontWeight: 600 }}>All stock levels are healthy!</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        No low stock or out-of-stock items detected.
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Recent Inventory Activity / Transactions */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid rgba(226, 232, 240, 0.9)',
            padding: '20px 24px',
            boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.04)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
            }}
          >
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
                📋 Recent Stock Adjustments
              </h3>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0 0' }}>
                Latest inventory ledger entries
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/admin/inventory')}
              style={{
                fontSize: '12px',
                color: '#2563eb',
                fontWeight: 500,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              View Ledger
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {transactions.length > 0 ? (
              transactions.map((tx, idx) => {
                const isPositive = (tx.quantityChange || 0) > 0;
                const badgeColor =
                  tx.transactionType === 'RESTOCK'
                    ? '#059669'
                    : tx.transactionType === 'WRITE_OFF'
                    ? '#dc2626'
                    : '#2563eb';

                return (
                  <div
                    key={tx.transactionId || idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      background: '#f8fafc',
                      borderRadius: '10px',
                      border: '1px solid #f1f5f9',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: `${badgeColor}15`,
                            color: badgeColor,
                          }}
                        >
                          {tx.transactionType || 'ADJUST'}
                        </span>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#1e293b' }}>
                          SKU: {tx.variant?.skuCode || 'Item'}
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                        {formatDate(tx.createdAt)}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: '13px',
                          color: isPositive ? '#059669' : '#dc2626',
                        }}
                      >
                        {isPositive ? `+${tx.quantityChange}` : tx.quantityChange} units
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ padding: '24px 0', textAlign: 'center', color: '#94a3b8', fontSize: '12.5px' }}>
                No recent stock transactions recorded.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
