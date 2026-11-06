import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiShoppingCart, FiRotateCcw, FiArrowRight } from 'react-icons/fi';
import { useGetOrdersQuery } from '../../features/orders/orderApi';
import type { OrderResponseDto } from '../../types/order';
import {
  getRefundStats,
  type RefundStats,
} from '../../features/refunds/refundApi';
import styles from '../AdminDashboard.module.css';

export const SalesOrderDashboard: React.FC = () => {
  const navigate = useNavigate();

  // Fetch Orders
  const {
    data: orderData,
    isLoading: ordersLoading,
    refetch,
  } = useGetOrdersQuery({
    page: 0,
    size: 200,
  });
  const orders: OrderResponseDto[] = useMemo(
    () => orderData?.content || [],
    [orderData]
  );

  // Fetch Refund Stats
  const [refundStats, setRefundStats] = useState<RefundStats | null>(null);

  useEffect(() => {
    getRefundStats()
      .then((data) => setRefundStats(data))
      .catch(() => setRefundStats(null));
  }, []);

  // Compute Metrics
  const todayStr =
    orders.length > 0 && orders[0].createdAt
      ? orders[0].createdAt.split('T')[0]
      : new Date().toISOString().split('T')[0];

  const todayOrders = useMemo(() => {
    return orders.filter(
      (o) => o.createdAt && o.createdAt.startsWith(todayStr)
    );
  }, [orders, todayStr]);

  const todayRevenue = useMemo(() => {
    return todayOrders.reduce(
      (sum, o) => sum + (Number(o.totalAmount) || 0),
      0
    );
  }, [todayOrders]);

  const totalRevenue = useMemo(() => {
    return orders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
  }, [orders]);
  console.log('Fetched Orders:', orders);
  console.log('Today String:', todayStr);

  // Status counts
  const pendingCount = useMemo(
    () =>
      orders.filter(
        (o) => o.orderStatus === 'PENDING' || o.orderStatus === 'PLACED'
      ).length,
    [orders]
  );

  const processingCount = useMemo(
    () =>
      orders.filter(
        (o) => o.orderStatus === 'PROCESSING' || o.orderStatus === 'CONFIRMED'
      ).length,
    [orders]
  );

  const shippedCount = useMemo(
    () =>
      orders.filter(
        (o) => o.orderStatus === 'SHIPPED' || o.orderStatus === 'IN_TRANSIT'
      ).length,
    [orders]
  );

  const deliveredCount = useMemo(
    () => orders.filter((o) => o.orderStatus === 'DELIVERED').length,
    [orders]
  );

  const cancelledCount = useMemo(
    () =>
      orders.filter(
        (o) => o.orderStatus === 'CANCELLED' || o.orderStatus === 'RETURNED'
      ).length,
    [orders]
  );

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US').format(Math.round(val)) + ' MMK';
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      let hoursNum = d.getHours();
      const ampm = hoursNum >= 12 ? 'PM' : 'AM';
      hoursNum = hoursNum % 12;
      hoursNum = hoursNum ? hoursNum : 12;
      const hours = String(hoursNum).padStart(2, '0');
      const mins = String(d.getMinutes()).padStart(2, '0');
      return `${day}/${month}/${year}, ${hours}:${mins} ${ampm}`;
    } catch {
      return dateStr;
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
      case 'PLACED':
        return (
          <span
            style={{
              padding: '3px 10px',
              borderRadius: '9999px',
              fontSize: '11px',
              fontWeight: 600,
              background: '#fef3c7',
              color: '#92400e',
            }}
          >
            ⏳ PENDING
          </span>
        );
      case 'PROCESSING':
      case 'CONFIRMED':
        return (
          <span
            style={{
              padding: '3px 10px',
              borderRadius: '9999px',
              fontSize: '11px',
              fontWeight: 600,
              background: '#dbeafe',
              color: '#1e40af',
            }}
          >
            ⚙️ PROCESSING
          </span>
        );
      case 'SHIPPED':
      case 'IN_TRANSIT':
        return (
          <span
            style={{
              padding: '3px 10px',
              borderRadius: '9999px',
              fontSize: '11px',
              fontWeight: 600,
              background: '#e0e7ff',
              color: '#4338ca',
            }}
          >
            🚚 SHIPPED
          </span>
        );
      case 'DELIVERED':
        return (
          <span
            style={{
              padding: '3px 10px',
              borderRadius: '9999px',
              fontSize: '11px',
              fontWeight: 600,
              background: '#d1fae5',
              color: '#065f46',
            }}
          >
            ✅ DELIVERED
          </span>
        );
      case 'CANCELLED':
        return (
          <span
            style={{
              padding: '3px 10px',
              borderRadius: '9999px',
              fontSize: '11px',
              fontWeight: 600,
              background: '#fee2e2',
              color: '#991b1b',
            }}
          >
            ❌ CANCELLED
          </span>
        );
      default:
        return (
          <span
            style={{
              padding: '3px 10px',
              borderRadius: '9999px',
              fontSize: '11px',
              fontWeight: 600,
              background: '#f1f5f9',
              color: '#475569',
            }}
          >
            {status}
          </span>
        );
    }
  };

  return (
    <div className={styles.dashboardContainer}>
      {/* Header */}
      <div className={styles.headerSection}>
        <div className={styles.headerLeft}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>🛍️</span>
            <h1 className={styles.headerTitle}>Order &amp; Sales Operations</h1>
          </div>
          <p className={styles.headerSubtitle}>
            Process customer orders, monitor fulfillment pipelines, and handle
            return requests
          </p>
        </div>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={() => navigate('/admin/orders')}
          >
            <FiShoppingCart size={16} /> All Orders
          </button>
          <button
            type="button"
            className={styles.primaryBtn}
            style={{ background: '#7c3aed' }}
            onClick={() => navigate('/admin/refunds')}
          >
            <FiRotateCcw size={16} /> Refund Requests
          </button>
        </div>
      </div>

      {/* Top 4 KPI Cards */}
      <div className={styles.statsGrid}>
        {/* Card 1: Today's Sales */}
        <div
          className={styles.statCard}
          onClick={() => navigate('/admin/orders')}
        >
          <div className={styles.cardHeader}>
            <span className={styles.cardTrendPositive}>Today's Sales</span>
          </div>
          <div className={styles.cardBottom}>
            <p className={styles.cardLabel}>Revenue</p>
            <h3 className={styles.cardValue}>{formatCurrency(todayRevenue)}</h3>
          </div>
        </div>

        {/* Card 2: Orders Awaiting Processing */}
        <div
          className={styles.statCard}
          style={
            pendingCount > 0 ? { borderColor: 'rgba(245, 158, 11, 0.7)' } : {}
          }
          onClick={() => navigate('/admin/orders')}
        >
          <div className={styles.cardHeader}>
            <span className={styles.cardTrendWarning}>Action Required</span>
          </div>
          <div className={styles.cardBottom}>
            <p className={styles.cardLabel}>Pending Orders</p>
            <h3
              className={styles.cardValue}
              style={pendingCount > 0 ? { color: '#d97706' } : {}}
            >
              {pendingCount}
            </h3>
          </div>
        </div>

        {/* Card 3: In Transit / Shipped */}
        <div
          className={styles.statCard}
          onClick={() => navigate('/admin/orders')}
        >
          <div className={styles.cardHeader}>
            <span className={styles.cardTrendNeutral}>Dispatched</span>
          </div>
          <div className={styles.cardBottom}>
            <p className={styles.cardLabel}>Shipped Orders</p>
            <h3 className={styles.cardValue}>{shippedCount}</h3>
          </div>
        </div>

        {/* Card 4: Pending Refunds */}
        <div
          className={styles.statCard}
          onClick={() => navigate('/admin/refunds')}
        >
          <div className={styles.cardHeader}>
            <span className={styles.cardTrendDanger}>Pending Review</span>
          </div>
          <div className={styles.cardBottom}>
            <p className={styles.cardLabel}>Refund Requests</p>
            <h3
              className={styles.cardValue}
              style={
                (refundStats?.pendingCount || 0) > 0 ? { color: '#dc2626' } : {}
              }
            >
              {refundStats?.pendingCount ?? 0}
            </h3>
          </div>
        </div>
      </div>

      {/* Fulfillment Pipeline Workflow */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid rgba(226, 232, 240, 0.9)',
          padding: '22px 24px',
          boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.04)',
        }}
      >
        <h3
          style={{
            fontSize: '15px',
            fontWeight: 600,
            color: '#0f172a',
            margin: '0 0 16px 0',
          }}
        >
          📦 Order Fulfillment Pipeline
        </h3>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '12px',
          }}
        >
          {/* Pending */}
          <div
            style={{
              padding: '14px',
              borderRadius: '12px',
              background: '#fffbeb',
              border: '1px solid #fef3c7',
              textAlign: 'center',
            }}
          >
            <div
              style={{ fontSize: '11px', fontWeight: 600, color: '#b45309' }}
            >
              1. PENDING
            </div>
            <div
              style={{
                fontSize: '20px',
                fontWeight: 700,
                color: '#92400e',
                marginTop: '4px',
              }}
            >
              {pendingCount}
            </div>
            <div
              style={{ fontSize: '11px', color: '#b45309', marginTop: '2px' }}
            >
              Awaiting Pack
            </div>
          </div>

          {/* Processing */}
          <div
            style={{
              padding: '14px',
              borderRadius: '12px',
              background: '#eff6ff',
              border: '1px solid #dbeafe',
              textAlign: 'center',
            }}
          >
            <div
              style={{ fontSize: '11px', fontWeight: 600, color: '#1d4ed8' }}
            >
              2. PROCESSING
            </div>
            <div
              style={{
                fontSize: '20px',
                fontWeight: 700,
                color: '#1e40af',
                marginTop: '4px',
              }}
            >
              {processingCount}
            </div>
            <div
              style={{ fontSize: '11px', color: '#1d4ed8', marginTop: '2px' }}
            >
              Being Packed
            </div>
          </div>

          {/* Shipped */}
          <div
            style={{
              padding: '14px',
              borderRadius: '12px',
              background: '#e0e7ff',
              border: '1px solid #c7d2fe',
              textAlign: 'center',
            }}
          >
            <div
              style={{ fontSize: '11px', fontWeight: 600, color: '#4338ca' }}
            >
              3. SHIPPED
            </div>
            <div
              style={{
                fontSize: '20px',
                fontWeight: 700,
                color: '#3730a3',
                marginTop: '4px',
              }}
            >
              {shippedCount}
            </div>
            <div
              style={{ fontSize: '11px', color: '#4338ca', marginTop: '2px' }}
            >
              In Transit
            </div>
          </div>

          {/* Delivered */}
          <div
            style={{
              padding: '14px',
              borderRadius: '12px',
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              textAlign: 'center',
            }}
          >
            <div
              style={{ fontSize: '11px', fontWeight: 600, color: '#047857' }}
            >
              4. DELIVERED
            </div>
            <div
              style={{
                fontSize: '20px',
                fontWeight: 700,
                color: '#065f46',
                marginTop: '4px',
              }}
            >
              {deliveredCount}
            </div>
            <div
              style={{ fontSize: '11px', color: '#047857', marginTop: '2px' }}
            >
              Completed
            </div>
          </div>

          {/* Cancelled */}
          <div
            style={{
              padding: '14px',
              borderRadius: '12px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              textAlign: 'center',
            }}
          >
            <div
              style={{ fontSize: '11px', fontWeight: 600, color: '#b91c1c' }}
            >
              5. CANCELLED
            </div>
            <div
              style={{
                fontSize: '20px',
                fontWeight: 700,
                color: '#991b1b',
                marginTop: '4px',
              }}
            >
              {cancelledCount}
            </div>
            <div
              style={{ fontSize: '11px', color: '#b91c1c', marginTop: '2px' }}
            >
              Voided
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders Processing Table */}
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
            <h3
              style={{
                fontSize: '16px',
                fontWeight: 600,
                color: '#0f172a',
                margin: 0,
              }}
            >
              🛒 Recent Customer Orders
            </h3>
            <p
              style={{
                fontSize: '12px',
                color: '#64748b',
                margin: '2px 0 0 0',
              }}
            >
              Latest customer purchases requiring tracking or dispatch
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/admin/orders')}
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
            View All ({orders.length}) <FiArrowRight size={13} />
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '13px',
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: '1px solid #e2e8f0',
                  color: '#64748b',
                  textAlign: 'left',
                }}
              >
                <th style={{ padding: '10px 8px', fontWeight: 600 }}>
                  Tracking / Order #
                </th>
                <th style={{ padding: '10px 8px', fontWeight: 600 }}>
                  Customer
                </th>
                <th style={{ padding: '10px 8px', fontWeight: 600 }}>
                  Date &amp; Time
                </th>
                <th style={{ padding: '10px 8px', fontWeight: 600 }}>
                  Total Amount
                </th>
                <th
                  style={{
                    padding: '10px 8px',
                    fontWeight: 600,
                    textAlign: 'center',
                  }}
                >
                  Status
                </th>
                <th
                  style={{
                    padding: '10px 8px',
                    fontWeight: 600,
                    textAlign: 'right',
                  }}
                >
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {orders.length > 0 ? (
                orders.slice(0, 8).map((order) => (
                  <tr
                    key={order.orderId}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      transition: 'background 0.15s ease',
                    }}
                  >
                    <td style={{ padding: '12px 8px' }}>
                      <span
                        style={{
                          fontWeight: 600,
                          color: '#2563eb',
                          fontFamily: 'monospace',
                          fontSize: '12.5px',
                        }}
                      >
                        {order.orderNo || `#ORD-${order.orderId}`}
                      </span>
                    </td>
                    <td style={{ padding: '12px 8px' }}>
                      <div style={{ fontWeight: 600, color: '#1e293b' }}>
                        {order.customerName || order.customerName || 'Customer'}
                      </div>
                    </td>
                    <td
                      style={{
                        padding: '12px 8px',
                        color: '#64748b',
                        fontSize: '12px',
                      }}
                    >
                      {formatDate(order.createdAt)}
                    </td>
                    <td
                      style={{
                        padding: '12px 8px',
                        fontWeight: 700,
                        color: '#0f172a',
                      }}
                    >
                      {formatCurrency(Number(order.totalAmount) || 0)}
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                      {renderStatusBadge(order.orderStatus || 'PENDING')}
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => navigate('/admin/orders')}
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
                        Process
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      padding: '32px 0',
                      textAlign: 'center',
                      color: '#64748b',
                    }}
                  >
                    No customer orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
