import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./AdminDashboard.module.css";
import {
  FiShoppingCart,
  FiPackage,
  FiUsers,
  FiTrendingUp,
  FiPieChart,
  FiBarChart2,
  FiActivity,
  FiAlertTriangle,
  FiCheckCircle,
  FiClock,
  FiEye,
  FiCalendar,
  FiPlus,
  FiChevronRight,
} from "react-icons/fi";
import { inventoryApi } from "../features/inventory/inventoryApi";
import { useGetOrdersQuery } from "../features/orders/orderApi";
import type { OrderResponseDto } from "../types/order";
import {
  productManagementApi,
  type ProductItem,
} from "../features/products/productManagementApi";
import api from "../utils/axiosConfig";
import { useSelector } from "react-redux";
import type { RootState } from "../store";
import { InventoryDashboard } from "./dashboard/InventoryDashboard";
import { SalesOrderDashboard } from "./dashboard/SalesOrderDashboard";

interface DailyMetric {
  dateKey: string;
  label: string;
  revenue: number;
  orders: number;
}

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const currentUser = useSelector((state: RootState) => state.auth);
  const userRole = currentUser?.role;

  // Dedicated automatic views for Staff Roles
  if (userRole === "INVENTORY_STAFF") {
    return <InventoryDashboard />;
  }

  if (userRole === "SALES_STAFF" || userRole === "ORDER_STAFF") {
    return <SalesOrderDashboard />;
  }
  const [lowStockCount, setLowStockCount] = useState<number>(0);
  const [staffCount, setStaffCount] = useState<number>(0);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [timeRange, setTimeRange] = useState<"7d" | "14d" | "30d">("7d");
  const [activeMetric, setActiveMetric] = useState<"revenue" | "orders">("revenue");
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);
  const [chartType, setChartType] = useState<"bar" | "area">("bar");

  // Real-time Orders & Revenue from Backend
  const { data: orderData } = useGetOrdersQuery({ page: 0, size: 200 });
  const orders: OrderResponseDto[] = useMemo(() => orderData?.content || [], [orderData]);

  const totalOrders = orderData?.totalElements ?? orders.length;
  const totalRevenue = useMemo(() => {
    return orders.reduce((acc: number, order: OrderResponseDto) => {
      return acc + (Number(order.totalAmount) || 0);
    }, 0);
  }, [orders]);

  useEffect(() => {
    // 1. Fetch Low Stock Alerts
    inventoryApi
      .getLowStockAlerts()
      .then((data) => setLowStockCount(data.length))
      .catch(() => setLowStockCount(0));

    // 2. Fetch Staff Count
    api
      .get("/staff")
      .then((res) => {
        if (Array.isArray(res.data)) {
          setStaffCount(res.data.length);
        }
      })
      .catch(() => setStaffCount(0));

    // 3. Fetch Products for Category Analysis
    productManagementApi
      .getProducts()
      .then((data) => setProducts(data))
      .catch(() => setProducts([]));
  }, []);

  // =========================================================
  // 1. REVENUE & ORDERS TREND GRAPH DATA
  // =========================================================
  const daysCount = timeRange === "7d" ? 7 : timeRange === "14d" ? 14 : 30;

  const chartData: DailyMetric[] = useMemo(() => {
    const list: DailyMetric[] = [];
    const today = new Date();

    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().split("T")[0]; // YYYY-MM-DD
      const label = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;

      list.push({
        dateKey,
        label,
        revenue: 0,
        orders: 0,
      });
    }

    // Aggregate orders into dates
    orders.forEach((order) => {
      if (!order.createdAt) return;
      const orderDateKey = new Date(order.createdAt).toISOString().split("T")[0];
      const match = list.find((m) => m.dateKey === orderDateKey);
      if (match) {
        match.orders += 1;
        match.revenue += Number(order.totalAmount) || 0;
      }
    });

    return list;
  }, [orders, daysCount]);

  // SVG Area & Bar Chart Geometry (Pixel-Perfect Alignment & Generous Left Y-Axis Spacing)
  const chartWidth = 760;
  const chartHeight = 260;
  const marginLeft = 72; // Space ensures Y-axis labels like "100k MMK" never clip or overlap
  const marginRight = 24;
  const marginTop = 20;
  const marginBottom = 34;
  const plotWidth = chartWidth - marginLeft - marginRight;
  const plotHeight = chartHeight - marginTop - marginBottom;

  const slotWidth = chartData.length > 0 ? plotWidth / chartData.length : plotWidth;
  const barWidth = Math.min(36, Math.max(14, slotWidth * 0.52));

  const maxVal = useMemo(() => {
    const vals = chartData.map((d) => (activeMetric === "revenue" ? d.revenue : d.orders));
    const max = Math.max(...vals, 0);
    if (max === 0) {
      return activeMetric === "revenue" ? 1000 : 10;
    }
    return Math.ceil(max * 1.2);
  }, [chartData, activeMetric]);

  const points = useMemo(() => {
    if (chartData.length === 0) return [];
    return chartData.map((d, index) => {
      const val = activeMetric === "revenue" ? d.revenue : d.orders;
      const x = marginLeft + (index + 0.5) * slotWidth;
      const y = marginTop + plotHeight - (val / (maxVal || 1)) * plotHeight;
      return { x, y, data: d, val, index };
    });
  }, [chartData, activeMetric, maxVal, slotWidth, marginLeft, marginTop, plotHeight]);

  // Build SVG path string with smooth spline curve
  const svgLinePath = useMemo(() => {
    if (points.length === 0) return "";
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
    return points.reduce((acc, pt, i) => {
      if (i === 0) return `M ${pt.x} ${pt.y}`;
      const prev = points[i - 1];
      const cp1x = prev.x + (pt.x - prev.x) / 2;
      const cp1y = prev.y;
      const cp2x = prev.x + (pt.x - prev.x) / 2;
      const cp2y = pt.y;
      return `${acc} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${pt.x} ${pt.y}`;
    }, "");
  }, [points]);

  const svgAreaPath = useMemo(() => {
    if (points.length === 0) return "";
    const bottomY = marginTop + plotHeight;
    const firstX = points[0].x;
    const lastX = points[points.length - 1].x;
    return `${svgLinePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  }, [svgLinePath, points, marginTop, plotHeight]);

  // Trend statistics summary
  const periodTotalRevenue = useMemo(() => {
    return chartData.reduce((acc, d) => acc + d.revenue, 0);
  }, [chartData]);

  const periodTotalOrders = useMemo(() => {
    return chartData.reduce((acc, d) => acc + d.orders, 0);
  }, [chartData]);

  const avgOrderVal = periodTotalOrders > 0 ? periodTotalRevenue / periodTotalOrders : 0;

  // =========================================================
  // 2. ORDER STATUS DISTRIBUTION (DONUT CHART)
  // =========================================================
  const statusStats = useMemo(() => {
    const counts: Record<string, number> = {
      DELIVERED: 0,
      PROCESSING: 0,
      SHIPPED: 0,
      PENDING: 0,
      CANCELLED: 0,
    };

    orders.forEach((o) => {
      const s = (o.orderStatus || "PENDING").toUpperCase();
      if (counts[s] !== undefined) {
        counts[s]++;
      } else {
        counts["PENDING"]++;
      }
    });

    const total = orders.length || 1;
    const colors: Record<string, string> = {
      DELIVERED: "#10b981", // Emerald
      PROCESSING: "#3b82f6", // Blue
      SHIPPED: "#8b5cf6", // Purple
      PENDING: "#f59e0b", // Amber
      CANCELLED: "#ef4444", // Red
    };

    const segments = Object.entries(counts).map(([name, count]) => {
      const percent = (count / total) * 100;
      return {
        name,
        count,
        percent,
        color: colors[name] || "#64748b",
      };
    });

    return { segments, totalOrders: orders.length };
  }, [orders]);

  const donutRadius = 56;
  const donutCircumference = 2 * Math.PI * donutRadius; // ~351.86

  // =========================================================
  // 3. TOP CATEGORIES DISTRIBUTION (BAR GRAPH)
  // =========================================================
  const categoryStats = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach((p) => {
      const cat = p.categoryName || "Uncategorized";
      counts[cat] = (counts[cat] || 0) + 1;
    });

    const totalProd = products.length || 1;
    const sorted = Object.entries(counts)
      .map(([name, count]) => ({
        name,
        count,
        percent: Math.round((count / totalProd) * 100),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const barColors = ["#2563eb", "#10b981", "#8b5cf6", "#f59e0b", "#06b6d4"];
    return sorted.map((s, idx) => ({
      ...s,
      color: barColors[idx % barColors.length],
    }));
  }, [products]);

  // =========================================================
  // 4. RECENT ORDERS
  // =========================================================
  const recentOrders = useMemo(() => {
    return [...orders]
      .sort((a, b) => new Date(b.createdAt || "").getTime() - new Date(a.createdAt || "").getTime())
      .slice(0, 5);
  }, [orders]);

  const getStatusBadgeClass = (status: string) => {
    const s = (status || "").toUpperCase();
    if (s === "DELIVERED" || s === "COMPLETED") return styles.statusDelivered;
    if (s === "PROCESSING" || s === "CONFIRMED") return styles.statusProcessing;
    if (s === "SHIPPED") return styles.statusShipped;
    if (s === "CANCELLED" || s === "FAILED") return styles.statusCancelled;
    return styles.statusPending;
  };

  return (
    <div className={styles.dashboardContainer}>
      {/* Header Bar */}
      <div className={styles.headerSection}>
        <div className={styles.headerLeft}>
          <h1 className={styles.headerTitle}>Admin Analytics Dashboard</h1>
          <p className={styles.headerSubtitle}>
            Real-time overview of revenue performance, orders lifecycle, and inventory health
          </p>
        </div>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={() => navigate("/admin/orders")}
          >
            <FiShoppingCart size={14} /> View Orders &rarr;
          </button>
        </div>
      </div>

      {/* Top 4 KPI Stat Cards */}
      <div className={styles.statsGrid}>
        {/* 1. Total Revenue */}
        <div
          className={`${styles.statCard} ${activeMetric === "revenue" ? styles.statCardActive : ""}`}
          onClick={() => setActiveMetric("revenue")}
          title="Click to view Revenue trend"
        >
          <div className={styles.statTopRow}>
            <span className={styles.statLabel}>Total revenue</span>
            <span className={styles.statDotBlue} />
          </div>
          <div className={styles.statValue}>
            {totalRevenue.toLocaleString()} MMK
          </div>
          <div className={styles.statBottomRow}>
            <span className={styles.statTrendGreen}>
              <FiTrendingUp size={13} /> Gross sales across all orders
            </span>
            <div className={`${styles.statIconBox} ${styles.iconGreen}`}>
              <span style={{ fontWeight: 700, fontSize: "13px", letterSpacing: "-0.02em" }}>Ks</span>
            </div>
          </div>
        </div>

        {/* 2. Total Orders */}
        <div
          className={`${styles.statCard} ${activeMetric === "orders" ? styles.statCardActive : ""}`}
          onClick={() => setActiveMetric("orders")}
          title="Click to view Orders trend"
        >
          <div className={styles.statTopRow}>
            <span className={styles.statLabel}>Total orders</span>
            <span className={styles.statDotBlue} />
          </div>
          <div className={styles.statValue}>{totalOrders.toLocaleString()}</div>
          <div className={styles.statBottomRow}>
            <span className={styles.statTrendBlue}>
              <FiShoppingCart size={13} /> Lifetime processed orders
            </span>
            <div className={`${styles.statIconBox} ${styles.iconBlue}`}>
              <FiShoppingCart size={15} />
            </div>
          </div>
        </div>

        {/* 3. Low Stock Alerts */}
        <div
          className={styles.statCard}
          onClick={() => navigate("/admin/inventory")}
          title="Click to manage stock & inventory"
        >
          <div className={styles.statTopRow}>
            <span className={styles.statLabel}>Low stock alerts</span>
            {lowStockCount > 0 && <span className={styles.statDotOrange} />}
          </div>
          <div className={styles.statValue}>{lowStockCount}</div>
          <div className={styles.statBottomRow}>
            <span
              className={styles.statTrend}
              style={{ color: lowStockCount > 0 ? "#ea580c" : "#059669" }}
            >
              <FiAlertTriangle size={13} /> {lowStockCount > 0 ? "Requires restocking" : "All stocks healthy"}
            </span>
            <div className={`${styles.statIconBox} ${styles.iconOrange}`}>
              <FiPackage size={15} />
            </div>
          </div>
        </div>

        {/* 4. Active Staff */}
        <div
          className={styles.statCard}
          onClick={() => navigate("/admin/staff")}
          title="Click to view staff roster"
        >
          <div className={styles.statTopRow}>
            <span className={styles.statLabel}>Active staff</span>
            <span className={styles.statDotPurple} />
          </div>
          <div className={styles.statValue}>{staffCount}</div>
          <div className={styles.statBottomRow}>
            <span className={styles.statTrendPurple}>
              <FiCheckCircle size={13} /> Store managers &amp; staff
            </span>
            <div className={`${styles.statIconBox} ${styles.iconPurple}`}>
              <FiUsers size={15} />
            </div>
          </div>
        </div>
      </div>

      {/* Primary Charts Section: Balanced Heights & Visual Hierarchy */}
      <div className={styles.chartsGrid}>
        {/* 1. REVENUE & ORDER TREND GRAPH CARD */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <div className={styles.chartTitleGroup}>
              <div className={`${styles.chartTitleIcon} ${styles.iconBlue}`}>
                <FiActivity size={17} />
              </div>
              <div>
                <h3 className={styles.chartTitle}>Sales &amp; revenue overview</h3>
                <p className={styles.chartSubtitle}>Daily breakdown of orders &amp; income</p>
              </div>
            </div>

            <div className={styles.chartControls}>
              {/* Chart Mode Toggle */}
              <div className={styles.segmentedGroup}>
                <button
                  type="button"
                  className={`${styles.segmentedBtn} ${chartType === "bar" ? styles.segmentedBtnActive : ""}`}
                  onClick={() => setChartType("bar")}
                  title="Bar View"
                >
                  <FiBarChart2 size={13} /> Bar
                </button>
                <button
                  type="button"
                  className={`${styles.segmentedBtn} ${chartType === "area" ? styles.segmentedBtnActive : ""}`}
                  onClick={() => setChartType("area")}
                  title="Area Spline View"
                >
                  <FiActivity size={13} /> Area
                </button>
              </div>

              {/* Metric Toggle */}
              <div className={styles.segmentedGroup}>
                <button
                  type="button"
                  className={`${styles.segmentedBtn} ${activeMetric === "revenue" ? styles.segmentedBtnActive : ""}`}
                  onClick={() => setActiveMetric("revenue")}
                >
                  Revenue (MMK)
                </button>
                <button
                  type="button"
                  className={`${styles.segmentedBtn} ${activeMetric === "orders" ? styles.segmentedBtnActive : ""}`}
                  onClick={() => setActiveMetric("orders")}
                >
                  # Orders
                </button>
              </div>

              {/* Time Range Pills */}
              <div className={styles.segmentedGroup}>
                <button
                  type="button"
                  className={`${styles.segmentedBtn} ${timeRange === "7d" ? styles.segmentedBtnActive : ""}`}
                  onClick={() => setTimeRange("7d")}
                >
                  7D
                </button>
                <button
                  type="button"
                  className={`${styles.segmentedBtn} ${timeRange === "14d" ? styles.segmentedBtnActive : ""}`}
                  onClick={() => setTimeRange("14d")}
                >
                  14D
                </button>
                <button
                  type="button"
                  className={`${styles.segmentedBtn} ${timeRange === "30d" ? styles.segmentedBtnActive : ""}`}
                  onClick={() => setTimeRange("30d")}
                >
                  30D
                </button>
              </div>
            </div>
          </div>

          {/* SVG Area & Bar Graph with Precise Margin Geometry */}
          <div className={styles.svgContainer}>
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              style={{ width: "100%", height: "260px", overflow: "visible" }}
            >
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity="0.01" />
                </linearGradient>
                <linearGradient id="royalBarGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#1d4ed8" />
                </linearGradient>
              </defs>

              {/* Horizontal Grid lines with non-overlapping Y-axis ticks */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                const yPos = marginTop + plotHeight * (1 - ratio);
                const displayVal = Math.round(maxVal * ratio);
                return (
                  <g key={i}>
                    <line
                      x1={marginLeft}
                      y1={yPos}
                      x2={chartWidth - marginRight}
                      y2={yPos}
                      stroke="#f1f5f9"
                      strokeWidth="1"
                      strokeDasharray="4 4"
                    />
                    <text
                      x={marginLeft - 14}
                      y={yPos + 4}
                      fill="#94a3b8"
                      fontSize="11"
                      textAnchor="end"
                      fontWeight="500"
                    >
                      {activeMetric === "revenue"
                        ? `${displayVal >= 1000000 ? `${(displayVal / 1000000).toFixed(displayVal % 1000000 === 0 ? 0 : 1)}M` : displayVal >= 1000 ? `${(displayVal / 1000).toFixed(displayVal % 1000 === 0 ? 0 : 1)}k` : displayVal.toLocaleString()} MMK`
                        : displayVal}
                    </text>
                  </g>
                );
              })}

              {/* Bar Chart Mode */}
              {chartType === "bar" && (
                <g>
                  {points.map((pt, idx) => {
                    const val = pt.val;
                    const barH = maxVal > 0 ? (val / maxVal) * (plotHeight - 6) : 0;
                    const x = pt.x - barWidth / 2;
                    const y = marginTop + plotHeight - barH;
                    const isHovered = hoveredPointIndex === idx;

                    return (
                      <g
                        key={idx}
                        onMouseEnter={() => setHoveredPointIndex(idx)}
                        onMouseLeave={() => setHoveredPointIndex(null)}
                        style={{ cursor: "pointer" }}
                      >
                        {/* Frosted rounded track column */}
                        <rect
                          x={x}
                          y={marginTop}
                          width={barWidth}
                          height={plotHeight}
                          fill={isHovered ? "rgba(239, 246, 255, 0.7)" : "rgba(248, 250, 252, 0.75)"}
                          rx="6"
                          ry="6"
                          style={{ transition: "fill 0.15s ease" }}
                        />

                        {/* Active bar with gradient & rounded top */}
                        {val > 0 ? (
                          <rect
                            x={x}
                            y={y}
                            width={barWidth}
                            height={Math.max(6, barH)}
                            fill="url(#royalBarGradient)"
                            rx="6"
                            ry="6"
                            style={{
                              transition: "all 0.2s ease",
                              filter: isHovered
                                ? "drop-shadow(0 4px 10px rgba(37, 99, 235, 0.35)) brightness(1.08)"
                                : "none",
                            }}
                          />
                        ) : (
                          <rect
                            x={x + barWidth / 4}
                            y={marginTop + plotHeight - 3}
                            width={barWidth / 2}
                            height={3}
                            fill="#cbd5e1"
                            rx="1.5"
                          />
                        )}

                        {/* Bottom Date Label */}
                        <text
                          x={pt.x}
                          y={chartHeight - 10}
                          fill={isHovered ? "#0f172a" : "#64748b"}
                          fontSize="11"
                          textAnchor="middle"
                          fontWeight={isHovered ? "700" : "500"}
                          style={{ transition: "all 0.15s ease" }}
                        >
                          {pt.data.label}
                        </text>
                      </g>
                    );
                  })}
                </g>
              )}

              {/* Area Spline Line Mode */}
              {chartType === "area" && (
                <g>
                  {/* Gradient Area Fill */}
                  {svgAreaPath && (
                    <path
                      d={svgAreaPath}
                      fill="url(#areaGradient)"
                      style={{ transition: "all 0.3s ease" }}
                    />
                  )}

                  {/* Spline Line */}
                  {svgLinePath && (
                    <path
                      d={svgLinePath}
                      fill="none"
                      stroke="#2563eb"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}

                  {/* Hover Vertical Guide Line */}
                  {hoveredPointIndex !== null && points[hoveredPointIndex] && (
                    <line
                      x1={points[hoveredPointIndex].x}
                      y1={marginTop}
                      x2={points[hoveredPointIndex].x}
                      y2={marginTop + plotHeight}
                      stroke="#3b82f6"
                      strokeWidth="1.5"
                      strokeDasharray="3 3"
                    />
                  )}

                  {/* Interactive Points on Line */}
                  {points.map((pt, idx) => {
                    const isHovered = hoveredPointIndex === idx;
                    return (
                      <g
                        key={idx}
                        onMouseEnter={() => setHoveredPointIndex(idx)}
                        onMouseLeave={() => setHoveredPointIndex(null)}
                        style={{ cursor: "pointer" }}
                      >
                        <circle cx={pt.x} cy={pt.y} r={16} fill="transparent" />
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={isHovered ? 6 : 4}
                          fill="#ffffff"
                          stroke="#2563eb"
                          strokeWidth={isHovered ? 3 : 2}
                          style={{
                            transition: "all 0.15s ease",
                            filter: isHovered
                              ? "drop-shadow(0 2px 6px rgba(37, 99, 235, 0.4))"
                              : "none",
                          }}
                        />

                        {/* Bottom Date Label */}
                        <text
                          x={pt.x}
                          y={chartHeight - 10}
                          fill={isHovered ? "#0f172a" : "#64748b"}
                          fontSize="11"
                          textAnchor="middle"
                          fontWeight={isHovered ? "700" : "500"}
                          style={{ transition: "all 0.15s ease" }}
                        >
                          {pt.data.label}
                        </text>
                      </g>
                    );
                  })}
                </g>
              )}
            </svg>

            {/* Modern Clean White Floating Tooltip (matching reference video) */}
            {hoveredPointIndex !== null && points[hoveredPointIndex] && (
              <div
                className={styles.chartTooltip}
                style={{
                  left: `${(points[hoveredPointIndex].x / chartWidth) * 100}%`,
                  top: `${Math.max(8, (points[hoveredPointIndex].y / chartHeight) * 100 - 22)}%`,
                }}
              >
                <div className={styles.tooltipDate}>
                  <FiCalendar size={11} /> {chartData[hoveredPointIndex].label}
                </div>
                <div className={styles.tooltipRow}>
                  <span className={styles.tooltipLabel}>Revenue:</span>
                  <span className={styles.tooltipValRevenue}>
                    {chartData[hoveredPointIndex].revenue.toLocaleString()} MMK
                  </span>
                </div>
                <div className={styles.tooltipRow}>
                  <span className={styles.tooltipLabel}>Orders:</span>
                  <span className={styles.tooltipValOrders}>
                    {chartData[hoveredPointIndex].orders} Orders
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Summary Metrics Row */}
          <div className={styles.summaryRow}>
            <div className={styles.summaryItem}>
              <div className={styles.summaryHeader}>
                <span className={styles.summaryLabel}>Period Revenue ({timeRange.toUpperCase()})</span>
                <span className={styles.summaryIconBlue} style={{ fontWeight: 700, fontSize: "12px" }}>Ks</span>
              </div>
              <h4 className={styles.summaryValue}>
                {periodTotalRevenue.toLocaleString()} MMK
              </h4>
              <span className={styles.summarySubtext}>Total gross for selected range</span>
            </div>

            <div className={styles.summaryItem}>
              <div className={styles.summaryHeader}>
                <span className={styles.summaryLabel}>Period Orders</span>
                <FiShoppingCart className={styles.summaryIconBlue} size={14} />
              </div>
              <h4 className={styles.summaryValue}>{periodTotalOrders.toLocaleString()} Orders</h4>
              <span className={styles.summarySubtext}>Completed transactions</span>
            </div>

            <div className={styles.summaryItem}>
              <div className={styles.summaryHeader}>
                <span className={styles.summaryLabel}>Avg Order Value (AOV)</span>
                <FiTrendingUp className={styles.summaryIconGreen} size={14} />
              </div>
              <h4 className={styles.summaryValue}>
                {avgOrderVal.toLocaleString()} MMK
              </h4>
              <span className={styles.summarySubtext}>Average basket per order</span>
            </div>
          </div>
        </div>

        {/* 2. ORDER STATUS DISTRIBUTION (DONUT CARD) */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <div className={styles.chartTitleGroup}>
              <div className={`${styles.chartTitleIcon} ${styles.iconPurple}`}>
                <FiPieChart size={17} />
              </div>
              <div>
                <h3 className={styles.chartTitle}>Order Statuses</h3>
                <p className={styles.chartSubtitle}>Distribution of order lifecycle</p>
              </div>
            </div>
            <span className={styles.headerCountPill}>
              {statusStats.totalOrders} Total
            </span>
          </div>

          <div className={styles.donutWrapper}>
            <div className={styles.donutSvgBox}>
              <svg width="156" height="156" viewBox="0 0 156 156">
                {/* Background Ring */}
                <circle
                  cx="78"
                  cy="78"
                  r={donutRadius}
                  fill="transparent"
                  stroke="#f1f5f9"
                  strokeWidth="18"
                />

                {(() => {
                  let accumulatedPercent = 0;
                  return statusStats.segments.map((seg, i) => {
                    if (seg.count === 0) return null;
                    const strokeDash = (seg.percent / 100) * donutCircumference;
                    const strokeSpace = donutCircumference - strokeDash;
                    const offset = -(accumulatedPercent / 100) * donutCircumference;
                    accumulatedPercent += seg.percent;

                    return (
                      <circle
                        key={i}
                        cx="78"
                        cy="78"
                        r={donutRadius}
                        fill="transparent"
                        stroke={seg.color}
                        strokeWidth="18"
                        strokeDasharray={`${strokeDash} ${strokeSpace}`}
                        strokeDashoffset={offset}
                        transform="rotate(-90 78 78)"
                        strokeLinecap="round"
                        style={{ transition: "stroke-dasharray 0.5s ease" }}
                      />
                    );
                  });
                })()}
              </svg>

              <div className={styles.donutCenterText}>
                <p className={styles.donutCenterNum}>{statusStats.totalOrders}</p>
                <p className={styles.donutCenterLabel}>ORDERS</p>
              </div>
            </div>

            {/* Status Legend List */}
            <div className={styles.donutLegend}>
              {statusStats.segments.map((seg, i) => (
                <div key={i} className={styles.legendItem}>
                  <div className={styles.legendColorLabel}>
                    <span className={styles.legendDot} style={{ background: seg.color }} />
                    <span className={styles.legendName}>{seg.name}</span>
                  </div>
                  <div className={styles.legendRightGroup}>
                    <span className={styles.legendCount}>{seg.count}</span>
                    <span className={styles.legendPercentBadge}>{Math.round(seg.percent)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Symmetrical Bottom Summary aligned with left card */}
          <div className={styles.donutFooter}>
            <div className={styles.fulfillmentPill}>
              <FiCheckCircle size={14} className={styles.fulfillmentIcon} />
              <span>
                Fulfillment Health:{" "}
                <strong>
                  {statusStats.totalOrders > 0
                    ? `${Math.round(((statusStats.segments.find((s) => s.name === "DELIVERED")?.count || 0) / statusStats.totalOrders) * 100)}%`
                    : "100%"}
                </strong>{" "}
                delivery rate
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Bottom Grid: Categories Bar Chart & Recent Orders Table */}
      <div className={styles.bottomGrid}>
        {/* 1. TOP CATEGORIES BAR CHART */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <div className={styles.chartTitleGroup}>
              <div className={`${styles.chartTitleIcon} ${styles.iconGreen}`}>
                <FiBarChart2 size={17} />
              </div>
              <div>
                <h3 className={styles.chartTitle}>Catalog by Category</h3>
                <p className={styles.chartSubtitle}>Products volume across categories</p>
              </div>
            </div>
            <button
              type="button"
              className={styles.headerLinkBtn}
              onClick={() => navigate("/admin/categories")}
            >
              Categories <FiChevronRight size={13} />
            </button>
          </div>

          <div className={styles.barList}>
            {categoryStats.length === 0 ? (
              <div className={styles.emptyContainer}>
                <div className={styles.emptyIconCircle}>
                  <FiPackage size={22} />
                </div>
                <h4 className={styles.emptyTitle}>No category data available yet</h4>
                <p className={styles.emptySubtitle}>
                  Create categories and assign products to analyze catalog distribution.
                </p>
                <button
                  type="button"
                  className={styles.emptyActionBtn}
                  onClick={() => navigate("/admin/categories")}
                >
                  <FiPlus size={13} /> Manage Categories
                </button>
              </div>
            ) : (
              categoryStats.map((cat, idx) => (
                <div key={idx} className={styles.barItem}>
                  <div className={styles.barHeader}>
                    <span className={styles.barName}>{cat.name}</span>
                    <span className={styles.barValue}>
                      {cat.count} products ({cat.percent}%)
                    </span>
                  </div>
                  <div className={styles.barTrack}>
                    <div
                      className={styles.barFill}
                      style={{
                        width: `${Math.max(6, cat.percent)}%`,
                        background: cat.color,
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 2. RECENT ORDERS TABLE */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <div className={styles.chartTitleGroup}>
              <div className={`${styles.chartTitleIcon} ${styles.iconOrange}`}>
                <FiClock size={17} />
              </div>
              <div>
                <h3 className={styles.chartTitle}>Recent Orders</h3>
                <p className={styles.chartSubtitle}>Latest store activity &amp; payments</p>
              </div>
            </div>
            <button
              type="button"
              className={styles.headerLinkBtn}
              onClick={() => navigate("/admin/orders")}
            >
              All Orders <FiChevronRight size={13} />
            </button>
          </div>

          <div className={styles.tableWrapper}>
            {recentOrders.length === 0 ? (
              <div className={styles.emptyContainer}>
                <div className={styles.emptyIconCircle}>
                  <FiShoppingCart size={22} />
                </div>
                <h4 className={styles.emptyTitle}>No recent orders found</h4>
                <p className={styles.emptySubtitle}>
                  Customer purchases and order updates will show up here automatically.
                </p>
                <button
                  type="button"
                  className={styles.emptyActionBtn}
                  onClick={() => navigate("/admin/orders")}
                >
                  <FiShoppingCart size={13} /> Go to Orders
                </button>
              </div>
            ) : (
              <table className={styles.ordersTable}>
                <thead>
                  <tr>
                    <th>Order No</th>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((ord) => (
                    <tr key={ord.orderId}>
                      <td style={{ fontWeight: 600, color: "#2563eb" }}>
                        #{ord.orderNo || ord.orderId}
                      </td>
                      <td>{ord.customerName || "Customer"}</td>
                      <td style={{ fontWeight: 700, color: "#0f172a" }}>
                        {Number(ord.totalAmount || 0).toLocaleString()} MMK
                      </td>
                      <td>
                        <span className={`${styles.statusBadge} ${getStatusBadgeClass(ord.orderStatus)}`}>
                          {ord.orderStatus || "PENDING"}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="table-btn-view"
                          onClick={() => navigate(`/admin/orders/${ord.orderNo}`)}
                        >
                          <FiEye size={12} /> View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
