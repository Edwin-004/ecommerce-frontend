import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { type RootState } from "../store";
import styles from "./AdminDashboard.module.css";
import {
  FiShoppingCart,
  FiDollarSign,
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
} from "react-icons/fi";
import { inventoryApi } from "../features/inventory/inventoryApi";
import { useGetOrdersQuery } from "../features/orders/orderApi";
import type { OrderResponseDto } from "../types/order";
import {
  productManagementApi,
  type ProductItem,
} from "../features/products/productManagementApi";
import api from "../utils/axiosConfig";

interface DailyMetric {
  dateKey: string;
  label: string;
  revenue: number;
  orders: number;
}

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const [lowStockCount, setLowStockCount] = useState<number>(0);
  const [staffCount, setStaffCount] = useState<number>(0);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [timeRange, setTimeRange] = useState<"7d" | "14d" | "30d">("7d");
  const [activeMetric, setActiveMetric] = useState<"revenue" | "orders">("revenue");
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  const { username, role } = useSelector((state: RootState) => state.auth);

  // Real-time Orders & Revenue from Backend
  const { data: orderData } = useGetOrdersQuery({ page: 0, size: 200 });
  const orders: OrderResponseDto[] = useMemo(() => orderData?.content || [], [orderData]);

  const totalOrders = orderData?.totalElements ?? orders.length;
  const totalRevenue = useMemo(() => {
    return orders.reduce((acc: number, order: OrderResponseDto) => {
      return acc + (Number(order.totalAmount) || 0);
    }, 0);
  }, [orders]);

  const formatRole = (roleStr: string | null) => {
    if (roleStr === "BUSINESS_OWNER" || roleStr === "OWNER") return "Business Owner";
    if (roleStr === "ADMIN") return "System Admin";
    if (roleStr === "INVENTORY_STAFF") return "Inventory Staff";
    if (roleStr === "SALES_STAFF") return "Sales Staff";
    return roleStr || "Staff";
  };

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
      const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

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

  // SVG Area Chart Geometry Calculations
  const chartWidth = 700;
  const chartHeight = 220;
  const paddingX = 40;
  const paddingY = 25;
  const plotWidth = chartWidth - paddingX * 2;
  const plotHeight = chartHeight - paddingY * 2;

  const maxVal = useMemo(() => {
    const vals = chartData.map((d) => (activeMetric === "revenue" ? d.revenue : d.orders));
    const max = Math.max(...vals, 0);
    return max === 0 ? (activeMetric === "revenue" ? 1000 : 10) : max * 1.15;
  }, [chartData, activeMetric]);

  const points = useMemo(() => {
    if (chartData.length === 0) return [];
    return chartData.map((d, index) => {
      const val = activeMetric === "revenue" ? d.revenue : d.orders;
      const x = paddingX + (index / (chartData.length - 1 || 1)) * plotWidth;
      const y = paddingY + plotHeight - (val / maxVal) * plotHeight;
      return { x, y, data: d, val };
    });
  }, [chartData, activeMetric, maxVal, plotWidth, plotHeight, paddingX, paddingY]);

  // Build SVG path string with smooth line
  const svgLinePath = useMemo(() => {
    if (points.length === 0) return "";
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
    const bottomY = paddingY + plotHeight;
    const firstX = points[0].x;
    const lastX = points[points.length - 1].x;
    return `${svgLinePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  }, [svgLinePath, points, paddingY, plotHeight]);

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

  // Donut SVG circumference calculations
  const donutRadius = 55;
  const donutCircumference = 2 * Math.PI * donutRadius; // ~345.57

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
        <div>
          <h1 className={styles.headerTitle}>Admin Analytics Dashboard</h1>
          <p className={styles.subtitle}>
            Welcome back, <strong>{username || "Admin"}</strong>! Here is what's happening with
            your ecommerce store today.
          </p>
        </div>
        <div className={styles.headerActions}>
          <span className={styles.badgeRole}>
            <FiCheckCircle color="#10b981" /> {formatRole(role)}
          </span>
          <button
            type="button"
            className={styles.pillBtn}
            style={{
              background: "#2563eb",
              color: "#ffffff",
              padding: "8px 16px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
            onClick={() => navigate("/admin/orders")}
          >
            <FiShoppingCart size={15} /> View Orders &rarr;
          </button>
        </div>
      </div>

      {/* Top 4 KPI Stat Cards */}
      <div className={styles.statsGrid}>
        {/* 1. Total Revenue */}
        <div
          className={styles.statCard}
          style={{ cursor: "pointer" }}
          onClick={() => {
            setActiveMetric("revenue");
          }}
          title="Filter chart by Revenue"
        >
          <div className={styles.statInfo}>
            <p className={styles.statLabel}>Total Revenue</p>
            <h2 className={styles.statValue}>
              ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h2>
            <p className={styles.statSubtext}>
              <FiTrendingUp color="#10b981" /> Gross sales across all orders
            </p>
          </div>
          <div className={`${styles.statIconBox} ${styles.iconGreen}`}>
            <FiDollarSign />
          </div>
        </div>

        {/* 2. Total Orders */}
        <div
          className={styles.statCard}
          style={{ cursor: "pointer" }}
          onClick={() => {
            setActiveMetric("orders");
          }}
          title="Filter chart by Orders count"
        >
          <div className={styles.statInfo}>
            <p className={styles.statLabel}>Total Orders</p>
            <h2 className={styles.statValue}>{totalOrders.toLocaleString()}</h2>
            <p className={styles.statSubtext}>
              <FiShoppingCart color="#2563eb" /> Lifetime processed orders
            </p>
          </div>
          <div className={`${styles.statIconBox} ${styles.iconBlue}`}>
            <FiShoppingCart />
          </div>
        </div>

        {/* 3. Low Stock Alerts */}
        <div
          className={styles.statCard}
          style={{ cursor: "pointer" }}
          onClick={() => navigate("/admin/inventory")}
          title="Click to manage stock & inventory"
        >
          <div className={styles.statInfo}>
            <p className={styles.statLabel}>Low Stock Alerts</p>
            <h2 className={styles.statValue}>{lowStockCount}</h2>
            <p className={styles.statSubtext} style={{ color: lowStockCount > 0 ? "#ea580c" : "#10b981" }}>
              <FiAlertTriangle /> {lowStockCount > 0 ? "Requires restocking" : "All stocks healthy"}
            </p>
          </div>
          <div className={`${styles.statIconBox} ${styles.iconOrange}`}>
            <FiPackage />
          </div>
        </div>

        {/* 4. Staff Team */}
        <div
          className={styles.statCard}
          style={{ cursor: "pointer" }}
          onClick={() => navigate("/admin/staff")}
          title="Click to view staff roster"
        >
          <div className={styles.statInfo}>
            <p className={styles.statLabel}>Active Staff</p>
            <h2 className={styles.statValue}>{staffCount}</h2>
            <p className={styles.statSubtext}>
              <FiUsers color="#9333ea" /> Store managers &amp; staff
            </p>
          </div>
          <div className={`${styles.statIconBox} ${styles.iconPurple}`}>
            <FiUsers />
          </div>
        </div>
      </div>

      {/* Primary Charts Section */}
      <div className={styles.chartsGrid}>
        {/* 1. REVENUE & ORDER TREND AREA GRAPH */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <div className={styles.chartTitleGroup}>
              <div className={`${styles.chartTitleIcon} ${styles.iconBlue}`}>
                <FiActivity />
              </div>
              <div>
                <h3 className={styles.chartTitle}>Sales &amp; Revenue Trends</h3>
                <p className={styles.chartSubtitle}>
                  Dynamic timeline graph displaying revenue &amp; orders over time
                </p>
              </div>
            </div>

            <div className={styles.chartControls}>
              {/* Metric Toggle */}
              <div className={styles.metricToggle}>
                <button
                  type="button"
                  className={`${styles.metricBtn} ${activeMetric === "revenue" ? styles.metricBtnActive : ""}`}
                  onClick={() => setActiveMetric("revenue")}
                >
                  $ Revenue
                </button>
                <button
                  type="button"
                  className={`${styles.metricBtn} ${activeMetric === "orders" ? styles.metricBtnActive : ""}`}
                  onClick={() => setActiveMetric("orders")}
                >
                  # Orders
                </button>
              </div>

              {/* Time Range Pills */}
              <div className={styles.pillGroup}>
                <button
                  type="button"
                  className={`${styles.pillBtn} ${timeRange === "7d" ? styles.pillBtnActive : ""}`}
                  onClick={() => setTimeRange("7d")}
                >
                  7 Days
                </button>
                <button
                  type="button"
                  className={`${styles.pillBtn} ${timeRange === "14d" ? styles.pillBtnActive : ""}`}
                  onClick={() => setTimeRange("14d")}
                >
                  14 Days
                </button>
                <button
                  type="button"
                  className={`${styles.pillBtn} ${timeRange === "30d" ? styles.pillBtnActive : ""}`}
                  onClick={() => setTimeRange("30d")}
                >
                  30 Days
                </button>
              </div>
            </div>
          </div>

          {/* SVG Area & Spline Line Graph */}
          <div className={styles.svgContainer}>
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              style={{ width: "100%", height: "auto", overflow: "visible" }}
            >
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                const yPos = paddingY + plotHeight * (1 - ratio);
                const displayVal = Math.round(maxVal * ratio);
                return (
                  <g key={i}>
                    <line
                      x1={paddingX}
                      y1={yPos}
                      x2={chartWidth - paddingX}
                      y2={yPos}
                      stroke="#f1f5f9"
                      strokeDasharray="4 4"
                    />
                    <text
                      x={paddingX - 8}
                      y={yPos + 4}
                      fill="#94a3b8"
                      fontSize="10"
                      textAnchor="end"
                      fontWeight="500"
                    >
                      {activeMetric === "revenue" ? `$${displayVal.toLocaleString()}` : displayVal}
                    </text>
                  </g>
                );
              })}

              {/* Gradient Area Fill */}
              {svgAreaPath && <path d={svgAreaPath} fill="url(#areaGradient)" />}

              {/* Spline Line */}
              {svgLinePath && (
                <path
                  d={svgLinePath}
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Hover Guide Line */}
              {hoveredPointIndex !== null && points[hoveredPointIndex] && (
                <line
                  x1={points[hoveredPointIndex].x}
                  y1={paddingY}
                  x2={points[hoveredPointIndex].x}
                  y2={paddingY + plotHeight}
                  stroke="#94a3b8"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
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
                    {/* Big transparent target for effortless hovering on touch/mouse */}
                    <circle cx={pt.x} cy={pt.y} r={14} fill="transparent" />
                    {/* Outer ring */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isHovered ? 6.5 : 4}
                      fill="#ffffff"
                      stroke="#2563eb"
                      strokeWidth={isHovered ? 3.5 : 2.5}
                      style={{ transition: "all 0.15s ease" }}
                    />

                    {/* Bottom Date Label (show subset if 30 days) */}
                    {(timeRange !== "30d" || idx % 3 === 0 || idx === points.length - 1) && (
                      <text
                        x={pt.x}
                        y={chartHeight - 4}
                        fill="#64748b"
                        fontSize="11"
                        textAnchor="middle"
                        fontWeight={isHovered ? "700" : "500"}
                      >
                        {pt.data.label}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Floating Tooltip Box */}
            {hoveredPointIndex !== null && points[hoveredPointIndex] && (
              <div
                style={{
                  position: "absolute",
                  left: `${(points[hoveredPointIndex].x / chartWidth) * 100}%`,
                  top: `${Math.max(10, (points[hoveredPointIndex].y / chartHeight) * 100 - 40)}%`,
                  transform: "translate(-50%, -100%)",
                  background: "#0f172a",
                  color: "#ffffff",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.2)",
                  pointerEvents: "none",
                  zIndex: 20,
                  fontSize: "12px",
                  whiteSpace: "nowrap",
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: "4px", color: "#93c5fd" }}>
                  {points[hoveredPointIndex].data.label}
                </div>
                <div>
                  Revenue: <strong>${points[hoveredPointIndex].data.revenue.toLocaleString()}</strong>
                </div>
                <div>
                  Orders: <strong>{points[hoveredPointIndex].data.orders}</strong>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Summary Metrics Row */}
          <div className={styles.summaryRow}>
            <div className={styles.summaryItem}>
              <p className={styles.summaryLabel}>Period Revenue ({timeRange})</p>
              <h4 className={styles.summaryValue}>
                ${periodTotalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h4>
            </div>
            <div className={styles.summaryItem}>
              <p className={styles.summaryLabel}>Period Orders</p>
              <h4 className={styles.summaryValue}>{periodTotalOrders.toLocaleString()} Orders</h4>
            </div>
            <div className={styles.summaryItem}>
              <p className={styles.summaryLabel}>Avg Order Value (AOV)</p>
              <h4 className={styles.summaryValue}>
                ${avgOrderVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h4>
            </div>
          </div>
        </div>

        {/* 2. ORDER STATUS DONUT CHART */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <div className={styles.chartTitleGroup}>
              <div className={`${styles.chartTitleIcon} ${styles.iconPurple}`}>
                <FiPieChart />
              </div>
              <div>
                <h3 className={styles.chartTitle}>Order Statuses</h3>
                <p className={styles.chartSubtitle}>Distribution of order lifecycle</p>
              </div>
            </div>
          </div>

          <div className={styles.donutWrapper}>
            <div className={styles.donutSvgBox}>
              <svg width="150" height="150" viewBox="0 0 150 150">
                <circle
                  cx="75"
                  cy="75"
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
                        cx="75"
                        cy="75"
                        r={donutRadius}
                        fill="transparent"
                        stroke={seg.color}
                        strokeWidth="18"
                        strokeDasharray={`${strokeDash} ${strokeSpace}`}
                        strokeDashoffset={offset}
                        transform="rotate(-90 75 75)"
                        style={{ transition: "stroke-dasharray 0.5s ease" }}
                      />
                    );
                  });
                })()}
              </svg>

              <div className={styles.donutCenterText}>
                <p className={styles.donutCenterNum}>{statusStats.totalOrders}</p>
                <p className={styles.donutCenterLabel}>Orders</p>
              </div>
            </div>

            {/* Status Legend List */}
            <div className={styles.donutLegend}>
              {statusStats.segments.map((seg, i) => (
                <div key={i} className={styles.legendItem}>
                  <div className={styles.legendColorLabel}>
                    <span className={styles.legendDot} style={{ background: seg.color }} />
                    <span>{seg.name}</span>
                  </div>
                  <span className={styles.legendCount}>
                    {seg.count} ({Math.round(seg.percent)}%)
                  </span>
                </div>
              ))}
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
                <FiBarChart2 />
              </div>
              <div>
                <h3 className={styles.chartTitle}>Catalog by Category</h3>
                <p className={styles.chartSubtitle}>Products volume across categories</p>
              </div>
            </div>
            <button
              type="button"
              className={styles.pillBtn}
              onClick={() => navigate("/admin/categories")}
              style={{ color: "#2563eb", fontWeight: 700 }}
            >
              Categories &rarr;
            </button>
          </div>

          <div className={styles.barList}>
            {categoryStats.length === 0 ? (
              <p style={{ color: "#94a3b8", textAlign: "center", margin: "20px 0" }}>
                No category data available yet.
              </p>
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
                <FiClock />
              </div>
              <div>
                <h3 className={styles.chartTitle}>Recent Orders</h3>
                <p className={styles.chartSubtitle}>Latest store activity &amp; payments</p>
              </div>
            </div>
            <button
              type="button"
              className={styles.pillBtn}
              onClick={() => navigate("/admin/orders")}
              style={{ color: "#2563eb", fontWeight: 700 }}
            >
              All Orders &rarr;
            </button>
          </div>

          <div className={styles.tableWrapper}>
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
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", color: "#94a3b8", padding: "24px" }}>
                      No recent orders found.
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((ord) => (
                    <tr key={ord.orderId}>
                      <td style={{ fontWeight: 600, color: "#2563eb" }}>
                        #{ord.orderNo || ord.orderId}
                      </td>
                      <td>{ord.customerName || "Customer"}</td>
                      <td style={{ fontWeight: 700, color: "#0f172a" }}>
                        ${Number(ord.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td>
                        <span className={`${styles.statusBadge} ${getStatusBadgeClass(ord.orderStatus)}`}>
                          {ord.orderStatus || "PENDING"}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className={styles.pillBtn}
                          onClick={() => navigate(`/admin/orders/${ord.orderNo}`)}
                          style={{
                            background: "#eff6ff",
                            color: "#2563eb",
                            padding: "4px 8px",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <FiEye size={12} /> View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};