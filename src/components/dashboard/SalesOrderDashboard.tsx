import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiShoppingCart,
  FiShoppingBag,
  FiClock,
  FiTruck,
  FiCheckCircle,
  FiXCircle,
  FiRotateCcw,
  FiArrowRight,
  FiEye,
  FiPackage,
  FiTrendingUp,
  FiLayers,
  FiPieChart,
} from 'react-icons/fi';
import { useGetOrdersQuery, useGetOrderStatusCountsQuery } from '../../features/orders/orderApi';
import type { OrderResponseDto } from '../../types/order';
import { getRefundStats, type RefundStats } from '../../features/refunds/refundApi';
import styles from './SalesOrderDashboard.module.css';

export const SalesOrderDashboard: React.FC = () => {
  const navigate = useNavigate();

  // Fetch Orders (Real-time recent list)
  const { data: orderData, refetch: refetchOrders } = useGetOrdersQuery({
    page: 0,
    size: 200,
  });
  const orders: OrderResponseDto[] = useMemo(
    () => orderData?.content || [],
    [orderData]
  );

  // Fetch Exact Aggregated Counts Across ALL Orders in System
  const { data: statusCountsData, refetch: refetchStatusCounts } = useGetOrderStatusCountsQuery();

  // Total count of ALL orders
  const totalAllOrders = useMemo(() => {
    if (statusCountsData?.TOTAL !== undefined) {
      return Number(statusCountsData.TOTAL);
    }
    return orderData?.totalElements ?? orders.length;
  }, [statusCountsData, orderData, orders]);

  // Fetch Refund Stats
  const [refundStats, setRefundStats] = useState<RefundStats | null>(null);

  const fetchRefunds = () => {
    getRefundStats()
      .then((data) => setRefundStats(data))
      .catch(() => setRefundStats(null));
  };

  useEffect(() => {
    fetchRefunds();
  }, []);

  // Listen to Global Topbar Refresh Event
  useEffect(() => {
    const handleGlobalRefresh = () => {
      refetchOrders();
      refetchStatusCounts();
      fetchRefunds();
    };
    window.addEventListener('admin:refresh', handleGlobalRefresh);
    return () => window.removeEventListener('admin:refresh', handleGlobalRefresh);
  }, [refetchOrders, refetchStatusCounts]);

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

  // Lifecycle status counts across ALL orders (matches All Orders tabs: PENDING, PAID, PROCESSING, SHIPPED, DELIVERED, CANCELLED)
  const pendingCount = useMemo(() => {
    if (statusCountsData) {
      return (Number(statusCountsData.PENDING) || 0) + (Number(statusCountsData.PLACED) || 0);
    }
    return orders.filter((o) => {
      const s = (o.orderStatus || (o as unknown as { status?: string }).status || '').toUpperCase();
      return s === 'PENDING' || s === 'PLACED';
    }).length;
  }, [statusCountsData, orders]);

  const paidCount = useMemo(() => {
    if (statusCountsData) {
      return Number(statusCountsData.PAID) || 0;
    }
    return orders.filter((o) => {
      const s = (o.orderStatus || (o as unknown as { status?: string }).status || '').toUpperCase();
      return s === 'PAID';
    }).length;
  }, [statusCountsData, orders]);

  const processingCount = useMemo(() => {
    if (statusCountsData) {
      return (Number(statusCountsData.PROCESSING) || 0) + (Number(statusCountsData.CONFIRMED) || 0);
    }
    return orders.filter((o) => {
      const s = (o.orderStatus || (o as unknown as { status?: string }).status || '').toUpperCase();
      return s === 'PROCESSING' || s === 'CONFIRMED';
    }).length;
  }, [statusCountsData, orders]);

  const shippedCount = useMemo(() => {
    if (statusCountsData) {
      return (Number(statusCountsData.SHIPPED) || 0) + (Number(statusCountsData.IN_TRANSIT) || 0);
    }
    return orders.filter((o) => {
      const s = (o.orderStatus || (o as unknown as { status?: string }).status || '').toUpperCase();
      return s === 'SHIPPED' || s === 'IN_TRANSIT';
    }).length;
  }, [statusCountsData, orders]);

  const deliveredCount = useMemo(() => {
    if (statusCountsData) {
      return Number(statusCountsData.DELIVERED) || 0;
    }
    return orders.filter((o) => {
      const s = (o.orderStatus || (o as unknown as { status?: string }).status || '').toUpperCase();
      return s === 'DELIVERED';
    }).length;
  }, [statusCountsData, orders]);

  const cancelledCount = useMemo(() => {
    if (statusCountsData) {
      return (Number(statusCountsData.CANCELLED) || 0) + (Number(statusCountsData.RETURNED) || 0);
    }
    return orders.filter((o) => {
      const s = (o.orderStatus || (o as unknown as { status?: string }).status || '').toUpperCase();
      return s === 'CANCELLED' || s === 'RETURNED';
    }).length;
  }, [statusCountsData, orders]);

  // Non-redundant operational aggregates
  const activeQueueCount = pendingCount + paidCount + processingCount + shippedCount;
  const avgOrderValue = totalAllOrders > 0 ? (totalRevenue / (orders.length || 1)) : 0;

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

  const getStatusBadgeClass = (status: string) => {
    const s = (status || '').toUpperCase();
    if (s === 'DELIVERED' || s === 'COMPLETED') return styles.statusDelivered;
    if (s === 'PAID') return styles.statusDelivered;
    if (s === 'PROCESSING' || s === 'CONFIRMED') return styles.statusProcessing;
    if (s === 'SHIPPED' || s === 'IN_TRANSIT') return styles.statusShipped;
    if (s === 'CANCELLED' || s === 'FAILED' || s === 'RETURNED') return styles.statusCancelled;
    return styles.statusPending;
  };

  const getSharePercent = (count: number) => {
    if (totalAllOrders === 0) return 0;
    return Math.round((count / totalAllOrders) * 100);
  };

  return (
    <div className={styles.dashboardContainer}>
      {/* 1. Header Section (Refresh button removed since topbar already has it) */}
      <div className={styles.headerSection}>
        <div className={styles.headerLeft}>
          <div className={styles.headerTitleRow}>
            <div className={styles.headerIconBadge}>
              <FiShoppingBag size={18} />
            </div>
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
            <FiShoppingCart size={14} /> All Orders
          </button>
          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={() => navigate('/admin/refunds')}
          >
            <FiRotateCcw size={14} /> Refund Requests
          </button>
        </div>
      </div>

      {/* 2. Top 4 Non-Redundant Operational KPI Cards */}
      <div className={styles.statsGrid}>
        {/* Card 1: Today's Revenue */}
        <div
          className={styles.statCard}
          onClick={() => navigate('/admin/orders')}
          title="View today's sales and order volume"
        >
          <div className={styles.statTopRow}>
            <span className={styles.statLabel}>Today's Sales</span>
            <span className={`${styles.pillBadge} ${styles.pillGreen}`}>
              <span className={`${styles.statDot} ${styles.dotGreen}`} /> Today
            </span>
          </div>
          <div className={styles.statValue}>
            {formatCurrency(todayRevenue)}
          </div>
          <div className={styles.statBottomRow}>
            <span className={`${styles.statTrend} ${styles.statTrendGreen}`}>
              <FiTrendingUp size={12} /> {todayOrders.length} order{todayOrders.length === 1 ? '' : 's'} today
            </span>
            <div className={`${styles.statIconBox} ${styles.iconGreen}`}>
              <span style={{ fontWeight: 700, fontSize: '12px' }}>Ks</span>
            </div>
          </div>
        </div>

        {/* Card 2: Active Pipeline Queue */}
        <div
          className={styles.statCard}
          style={activeQueueCount > 0 ? { borderColor: 'rgba(37, 99, 235, 0.4)' } : undefined}
          onClick={() => navigate('/admin/orders')}
          title="Total orders currently moving through fulfillment"
        >
          <div className={styles.statTopRow}>
            <span className={styles.statLabel}>Active Queue</span>
            {activeQueueCount > 0 ? (
              <span className={`${styles.pillBadge} ${styles.pillBlue}`}>
                <span className={`${styles.statDot} ${styles.dotBlue}`} /> In Flight
              </span>
            ) : (
              <span className={`${styles.pillBadge} ${styles.pillGreen}`}>
                <span className={`${styles.statDot} ${styles.dotGreen}`} /> Cleared
              </span>
            )}
          </div>
          <div
            className={styles.statValue}
            style={activeQueueCount > 0 ? { color: '#1d4ed8' } : undefined}
          >
            {activeQueueCount}
          </div>
          <div className={styles.statBottomRow}>
            {activeQueueCount === 0 ? (
              <span className={`${styles.statTrend} ${styles.statTrendGreen}`}>
                <FiCheckCircle size={12} /> All orders fulfilled
              </span>
            ) : (
              <span className={`${styles.statTrend} ${styles.statTrendBlue}`}>
                <FiLayers size={12} /> {pendingCount} pending • {paidCount + processingCount} in-flight
              </span>
            )}
            <div className={`${styles.statIconBox} ${styles.iconBlue}`}>
              <FiPackage size={14} />
            </div>
          </div>
        </div>

        {/* Card 3: Average Order Value */}
        <div
          className={styles.statCard}
          onClick={() => navigate('/admin/orders')}
          title="Average customer spending per order"
        >
          <div className={styles.statTopRow}>
            <span className={styles.statLabel}>Avg. Order Value</span>
            <span className={`${styles.pillBadge} ${styles.pillPurple}`}>
              Overall
            </span>
          </div>
          <div className={styles.statValue}>
            {formatCurrency(avgOrderValue)}
          </div>
          <div className={styles.statBottomRow}>
            <span className={`${styles.statTrend} ${styles.statTrendPurple}`}>
              <FiPieChart size={12} /> Across {totalAllOrders} total order{totalAllOrders === 1 ? '' : 's'}
            </span>
            <div className={`${styles.statIconBox} ${styles.iconPurple}`}>
              <FiTrendingUp size={14} />
            </div>
          </div>
        </div>

        {/* Card 4: Customer Return & Refund Requests */}
        <div
          className={styles.statCard}
          style={(refundStats?.pendingCount || 0) > 0 ? { borderColor: 'rgba(239, 68, 68, 0.6)' } : undefined}
          onClick={() => navigate('/admin/refunds')}
          title="Customer return & refund cases requiring review"
        >
          <div className={styles.statTopRow}>
            <span className={styles.statLabel}>Refund Requests</span>
            {(refundStats?.pendingCount || 0) > 0 ? (
              <span className={`${styles.pillBadge} ${styles.pillRed}`}>
                <span className={`${styles.statDot} ${styles.dotAmber}`} /> Needs Action
              </span>
            ) : (
              <span className={`${styles.pillBadge} ${styles.pillGreen}`}>
                <span className={`${styles.statDot} ${styles.dotGreen}`} /> Handled
              </span>
            )}
          </div>
          <div
            className={styles.statValue}
            style={(refundStats?.pendingCount || 0) > 0 ? { color: '#dc2626' } : undefined}
          >
            {refundStats?.pendingCount ?? 0}
          </div>
          <div className={styles.statBottomRow}>
            <span
              className={`${styles.statTrend} ${(refundStats?.pendingCount || 0) > 0 ? styles.statTrendRed : styles.statTrendNeutral}`}
            >
              {(refundStats?.pendingCount || 0) > 0 ? (
                <>
                  <FiRotateCcw size={12} /> Requires refund review
                </>
              ) : (
                <>
                  <FiCheckCircle size={12} /> No pending disputes
                </>
              )}
            </span>
            <div className={`${styles.statIconBox} ${styles.iconAmber}`}>
              <FiRotateCcw size={14} />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Order Fulfillment Pipeline Stepper Card (5 Unified Crisp White Cards with 3px Top Accents) */}
      <div className={styles.pipelineCard}>
        <div className={styles.pipelineHeader}>
          <div className={styles.pipelineTitleGroup}>
            <div className={styles.pipelineIcon}>
              <FiLayers size={17} />
            </div>
            <div>
              <h3 className={styles.pipelineTitle}>Order Fulfillment Pipeline</h3>
              <p className={styles.pipelineSubtitle}>
                Sequential lifecycle tracking from checkout confirmation to customer delivery
              </p>
            </div>
          </div>
          <span className={styles.pipelineBadge}>
            Total Orders: {totalAllOrders}
          </span>
        </div>

        <div className={styles.pipelineGrid}>
          {/* Step 1: PENDING */}
          <div
            className={`${styles.stepCard} ${styles.stepPending}`}
            onClick={() => navigate('/admin/orders?status=PENDING')}
            title="Click to view pending orders"
          >
            <div className={styles.stepTopRow}>
              <span className={`${styles.stepTag} ${styles.tagPending}`}>
                <FiClock size={12} /> 1. PENDING
              </span>
              <span className={styles.stepShare}>
                {getSharePercent(pendingCount)}%
              </span>
            </div>
            <h4 className={styles.stepCount}>
              {pendingCount}
            </h4>
            <span className={styles.stepDesc}>
              Awaiting pack &amp; confirm
            </span>
            <div className={styles.stepProgressTrack}>
              <div
                className={styles.stepProgressFill}
                style={{ width: `${getSharePercent(pendingCount)}%`, background: '#f59e0b' }}
              />
            </div>
          </div>

          {/* Step 2: PAID */}
          <div
            className={`${styles.stepCard} ${styles.stepPaid}`}
            onClick={() => navigate('/admin/orders?status=PAID')}
            title="Click to view paid orders"
          >
            <div className={styles.stepTopRow}>
              <span className={`${styles.stepTag} ${styles.tagPaid}`}>
                <FiCheckCircle size={12} /> 2. PAID
              </span>
              <span className={styles.stepShare}>
                {getSharePercent(paidCount)}%
              </span>
            </div>
            <h4 className={styles.stepCount}>
              {paidCount}
            </h4>
            <span className={styles.stepDesc}>
              Payment verified &amp; ready
            </span>
            <div className={styles.stepProgressTrack}>
              <div
                className={styles.stepProgressFill}
                style={{ width: `${getSharePercent(paidCount)}%`, background: '#06b6d4' }}
              />
            </div>
          </div>

          {/* Step 3: PROCESSING */}
          <div
            className={`${styles.stepCard} ${styles.stepProcessing}`}
            onClick={() => navigate('/admin/orders?status=PROCESSING')}
            title="Click to view processing orders"
          >
            <div className={styles.stepTopRow}>
              <span className={`${styles.stepTag} ${styles.tagProcessing}`}>
                <FiPackage size={12} /> 3. PROCESSING
              </span>
              <span className={styles.stepShare}>
                {getSharePercent(processingCount)}%
              </span>
            </div>
            <h4 className={styles.stepCount}>
              {processingCount}
            </h4>
            <span className={styles.stepDesc}>
              Being picked &amp; packed
            </span>
            <div className={styles.stepProgressTrack}>
              <div
                className={styles.stepProgressFill}
                style={{ width: `${getSharePercent(processingCount)}%`, background: '#3b82f6' }}
              />
            </div>
          </div>

          {/* Step 4: SHIPPED */}
          <div
            className={`${styles.stepCard} ${styles.stepShipped}`}
            onClick={() => navigate('/admin/orders?status=SHIPPED')}
            title="Click to view orders in transit"
          >
            <div className={styles.stepTopRow}>
              <span className={`${styles.stepTag} ${styles.tagShipped}`}>
                <FiTruck size={12} /> 4. SHIPPED
              </span>
              <span className={styles.stepShare}>
                {getSharePercent(shippedCount)}%
              </span>
            </div>
            <h4 className={styles.stepCount}>
              {shippedCount}
            </h4>
            <span className={styles.stepDesc}>
              In transit with courier
            </span>
            <div className={styles.stepProgressTrack}>
              <div
                className={styles.stepProgressFill}
                style={{ width: `${getSharePercent(shippedCount)}%`, background: '#8b5cf6' }}
              />
            </div>
          </div>

          {/* Step 5: DELIVERED */}
          <div
            className={`${styles.stepCard} ${styles.stepDelivered}`}
            onClick={() => navigate('/admin/orders?status=DELIVERED')}
            title="Click to view completed orders"
          >
            <div className={styles.stepTopRow}>
              <span className={`${styles.stepTag} ${styles.tagDelivered}`}>
                <FiCheckCircle size={12} /> 5. DELIVERED
              </span>
              <span className={styles.stepShare}>
                {getSharePercent(deliveredCount)}%
              </span>
            </div>
            <h4 className={styles.stepCount}>
              {deliveredCount}
            </h4>
            <span className={styles.stepDesc}>
              Delivered to customer
            </span>
            <div className={styles.stepProgressTrack}>
              <div
                className={styles.stepProgressFill}
                style={{ width: `${getSharePercent(deliveredCount)}%`, background: '#10b981' }}
              />
            </div>
          </div>

          {/* Step 6: CANCELLED */}
          <div
            className={`${styles.stepCard} ${styles.stepCancelled}`}
            onClick={() => navigate('/admin/orders?status=CANCELLED')}
            title="Click to view cancelled or voided orders"
          >
            <div className={styles.stepTopRow}>
              <span className={`${styles.stepTag} ${styles.tagCancelled}`}>
                <FiXCircle size={12} /> 6. CANCELLED
              </span>
              <span className={styles.stepShare}>
                {getSharePercent(cancelledCount)}%
              </span>
            </div>
            <h4 className={styles.stepCount}>
              {cancelledCount}
            </h4>
            <span className={styles.stepDesc}>
              Voided or returned
            </span>
            <div className={styles.stepProgressTrack}>
              <div
                className={styles.stepProgressFill}
                style={{ width: `${getSharePercent(cancelledCount)}%`, background: '#ef4444' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 4. Recent Customer Orders Section */}
      <div className={styles.ordersCard}>
        <div className={styles.ordersHeader}>
          <div className={styles.ordersTitleGroup}>
            <div className={styles.ordersIcon}>
              <FiShoppingCart size={17} />
            </div>
            <div>
              <h3 className={styles.ordersTitle}>Recent Customer Orders</h3>
              <p className={styles.ordersSubtitle}>
                Latest customer purchases requiring tracking or dispatch
              </p>
            </div>
          </div>
          <button
            type="button"
            className={styles.headerLinkBtn}
            onClick={() => navigate('/admin/orders')}
          >
            View All Orders ({totalAllOrders}) <FiArrowRight size={13} />
          </button>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Tracking / Order #</th>
                <th>Customer</th>
                <th>Date &amp; Time</th>
                <th>Total Amount</th>
                <th style={{ textAlign: 'center' }}>Status</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.length > 0 ? (
                orders.slice(0, 8).map((order) => {
                  const displayStatus = order.orderStatus || (order as unknown as { status?: string }).status || 'PENDING';
                  return (
                    <tr key={order.orderId}>
                      <td>
                        <span className={styles.trackingCell}>
                          {order.shipment?.trackingNumber || order.orderNo || `#ORD-${order.orderId}`}
                        </span>
                      </td>
                      <td>
                        <div className={styles.customerName}>
                          {order.customerName || (order as unknown as { user?: { userName?: string } }).user?.userName || 'Customer'}
                        </div>
                        <div className={styles.customerEmail}>
                          {(order as unknown as { customerEmail?: string }).customerEmail || (order as unknown as { user?: { email?: string } }).user?.email || '—'}
                        </div>
                      </td>
                      <td style={{ color: '#64748b', fontSize: '12px' }}>
                        {formatDate(order.createdAt)}
                      </td>
                      <td className={styles.amountCell}>
                        {formatCurrency(Number(order.totalAmount) || 0)}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`${styles.statusBadge} ${getStatusBadgeClass(displayStatus)}`}>
                          {displayStatus}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className={styles.viewBtn}
                          onClick={() => navigate(`/admin/orders?orderNo=${order.orderNo || order.orderId}`)}
                          title="View order details"
                        >
                          <FiEye size={12} /> View Details
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6}>
                    <div className={styles.emptyState}>
                      <div className={styles.emptyIcon}>
                        <FiShoppingCart size={22} />
                      </div>
                      <h4 className={styles.emptyTitle}>No customer orders found</h4>
                      <p className={styles.emptyDesc}>
                        Customer purchases and order updates will show up here automatically.
                      </p>
                      <button
                        type="button"
                        className={styles.primaryBtn}
                        onClick={() => navigate('/admin/orders')}
                      >
                        <FiShoppingCart size={14} /> Go to Orders
                      </button>
                    </div>
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
