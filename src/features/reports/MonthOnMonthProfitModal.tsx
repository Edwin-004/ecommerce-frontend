import React, { useEffect, useState } from 'react';
import { 
  FiTrendingUp, 
  FiTrendingDown, 
  FiDownload, 
  FiX, 
  FiInfo, 
  FiChevronDown, 
  FiChevronUp,
  FiMinus,
  FiDollarSign,
  FiLayers
} from 'react-icons/fi';
import styles from './MonthOnMonthProfitModal.module.css';
import api from '../../utils/axiosConfig';

export interface TopVariantProfit {
  variantId: number;
  productName: string;
  sku: string;
  qtySold: number;
  unitPrice: number;
  costPrice: number;
  totalRevenue: number;
  totalProfit: number;
  marginPercentage: number;
}

export interface MonthlyDetail {
  month: number;
  monthName: string;
  orderCount: number;
  unitsSold: number;
  revenue: number;
  cost: number;
  grossProfit: number;
  marginPercentage: number;
  prevMonthRevenue: number;
  prevMonthProfit: number;
  revenueGrowthPercentage: number | null;
  profitGrowthPercentage: number | null;
  marginChangePoints: number | null;
  trend: string;
  topVariants: TopVariantProfit[];
}

export interface MonthlyProfitComparisonDto {
  year: number;
  annualRevenue: number;
  annualCost: number;
  annualGrossProfit: number;
  annualMarginPercentage: number;
  bestPerformingMonth: string;
  monthlyDetails: MonthlyDetail[];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onExportExcel: (year: number) => void;
  isExportingExcel?: boolean;
}

export const MonthOnMonthProfitModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onExportExcel,
  isExportingExcel = false
}) => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [data, setData] = useState<MonthlyProfitComparisonDto | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [onlyActiveMonths, setOnlyActiveMonths] = useState<boolean>(false);
  const [expandedMonth, setExpandedMonth] = useState<number | null>(null);

  const fetchReport = async (year: number) => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<MonthlyProfitComparisonDto>(`/reports/month-on-month-profit?year=${year}`);
      setData(res.data);
    } catch (err: any) {
      console.error('Failed to load MoM report:', err);
      setError('Unable to load Month-on-Month comparison data. Please ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchReport(selectedYear);
    }
  }, [isOpen, selectedYear]);

  if (!isOpen) return null;

  const formatMMK = (val: number | undefined | null) => {
    if (val === undefined || val === null) return '0 MMK';
    return Number(val).toLocaleString('en-US', { maximumFractionDigits: 0 }) + ' MMK';
  };

  const displayedMonths = data?.monthlyDetails.filter(m => {
    if (!onlyActiveMonths) return true;
    return m.orderCount > 0 || m.revenue > 0;
  }) || [];

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerTitle}>
            <div className={styles.headerIcon}>
              <FiDollarSign />
            </div>
            <div className={styles.titleText}>
              <h2>Month-on-Month Profit & Margin Comparison</h2>
              <p>Compare selling price vs cost price trends across months with order item historical snapshots</p>
            </div>
          </div>

          <div className={styles.headerActions}>
            <select
              className={styles.yearSelect}
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
            >
              <option value={2026}>2026</option>
              <option value={2025}>2025</option>
              <option value={2024}>2024</option>
            </select>

            <button
              className={styles.excelBtn}
              onClick={() => onExportExcel(selectedYear)}
              disabled={isExportingExcel}
            >
              <FiDownload />
              <span>{isExportingExcel ? 'Exporting...' : 'Export Excel'}</span>
            </button>

            <button className={styles.closeBtn} onClick={onClose} title="Close modal">
              <FiX />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className={styles.body}>
          {loading ? (
            <div className={styles.loadingSpinner}>
              <div className="spinner-border text-primary mb-3" role="status" />
              <span>Calculating monthly profits, COGS & margin changes...</span>
            </div>
          ) : error ? (
            <div className="alert alert-danger my-4">{error}</div>
          ) : data ? (
            <>
              {/* Top 4 Metric KPI Cards */}
              <div className={styles.summaryGrid}>
                <div className={styles.kpiCard}>
                  <span className={styles.kpiLabel}>Annual Revenue ({data.year})</span>
                  <span className={styles.kpiValue}>{formatMMK(data.annualRevenue)}</span>
                  <span className={styles.kpiSub}>Total sales volume</span>
                </div>

                <div className={styles.kpiCard}>
                  <span className={styles.kpiLabel}>Cost of Goods Sold (COGS)</span>
                  <span className={styles.kpiValue}>{formatMMK(data.annualCost)}</span>
                  <span className={styles.kpiSub} style={{ color: '#64748b' }}>Item cost snapshot at order</span>
                </div>

                <div className={styles.kpiCard}>
                  <span className={styles.kpiLabel}>Gross Profit</span>
                  <span className={styles.kpiValue} style={{ color: '#16a34a' }}>
                    {formatMMK(data.annualGrossProfit)}
                  </span>
                  <span className={styles.kpiSub}>Revenue - Cost</span>
                </div>

                <div className={styles.kpiCard}>
                  <span className={styles.kpiLabel}>Average Gross Margin</span>
                  <span className={styles.kpiValue} style={{ color: '#2563eb' }}>
                    {data.annualMarginPercentage}%
                  </span>
                  <span className={styles.kpiSub}>
                    Best: <strong>{data.bestPerformingMonth}</strong>
                  </span>
                </div>
              </div>

              {/* Explanatory Banner */}
              <div className={styles.infoBanner}>
                <FiInfo className={styles.bannerIcon} />
                <div>
                  <strong>Historical Price Snapshot Guarantee:</strong> Selling prices and cost prices are captured in 
                  <code style={{ background: '#dbeafe', padding: '1px 5px', borderRadius: 4, margin: '0 4px' }}>order_items.cost_price</code>
                  at the exact moment each order is placed. Even when variant prices change from 10,000 MMK to 12,000 MMK over consecutive months, 
                  each month's profit margin and growth rate remain 100% historically accurate.
                </div>
              </div>

              {/* Toolbar */}
              <div className={styles.tableToolbar}>
                <div className={styles.tableTitle}>
                  Monthly Performance Breakdown ({data.year})
                </div>
                <label className={styles.filterToggle}>
                  <input
                    type="checkbox"
                    checked={onlyActiveMonths}
                    onChange={(e) => setOnlyActiveMonths(e.target.checked)}
                  />
                  <span>Show only active months with sales</span>
                </label>
              </div>

              {/* Table */}
              <div className={styles.tableWrapper}>
                <table className={styles.momTable}>
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th>Orders / Units</th>
                      <th>Revenue</th>
                      <th>Cost (COGS)</th>
                      <th>Gross Profit</th>
                      <th>Margin %</th>
                      <th>MoM Rev Growth</th>
                      <th>MoM Profit Growth</th>
                      <th>Margin Pts</th>
                      <th>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedMonths.length === 0 ? (
                      <tr>
                        <td colSpan={10} style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                          No sales data recorded for the selected period.
                        </td>
                      </tr>
                    ) : (
                      displayedMonths.map((m) => {
                        const isExpanded = expandedMonth === m.month;
                        const isPositiveProfitGrowth = m.profitGrowthPercentage !== null && m.profitGrowthPercentage > 0;
                        const isNegativeProfitGrowth = m.profitGrowthPercentage !== null && m.profitGrowthPercentage < 0;

                        const isPositiveRevGrowth = m.revenueGrowthPercentage !== null && m.revenueGrowthPercentage > 0;
                        const isNegativeRevGrowth = m.revenueGrowthPercentage !== null && m.revenueGrowthPercentage < 0;

                        return (
                          <React.Fragment key={m.month}>
                            <tr className={m.orderCount > 0 ? styles.activeRow : ''}>
                              <td>
                                <strong>{m.monthName}</strong>
                              </td>
                              <td>
                                {m.orderCount} orders <span style={{ color: '#94a3b8' }}>({m.unitsSold} pcs)</span>
                              </td>
                              <td>{formatMMK(m.revenue)}</td>
                              <td style={{ color: '#64748b' }}>{formatMMK(m.cost)}</td>
                              <td style={{ color: m.grossProfit > 0 ? '#16a34a' : '#0f172a', fontWeight: 600 }}>
                                {formatMMK(m.grossProfit)}
                              </td>
                              <td>
                                <span style={{ 
                                  fontWeight: 600, 
                                  color: m.marginPercentage >= 30 ? '#16a34a' : m.marginPercentage > 0 ? '#d97706' : '#64748b' 
                                }}>
                                  {m.marginPercentage}%
                                </span>
                              </td>
                              <td>
                                {m.revenueGrowthPercentage !== null ? (
                                  <span className={`${styles.badgeGrowth} ${isPositiveRevGrowth ? styles.badgeUp : isNegativeRevGrowth ? styles.badgeDown : styles.badgeNeutral}`}>
                                    {isPositiveRevGrowth ? <FiTrendingUp /> : isNegativeRevGrowth ? <FiTrendingDown /> : <FiMinus />}
                                    {m.revenueGrowthPercentage > 0 ? `+${m.revenueGrowthPercentage}%` : `${m.revenueGrowthPercentage}%`}
                                  </span>
                                ) : (
                                  <span style={{ color: '#94a3b8' }}>-</span>
                                )}
                              </td>
                              <td>
                                {m.profitGrowthPercentage !== null ? (
                                  <span className={`${styles.badgeGrowth} ${isPositiveProfitGrowth ? styles.badgeUp : isNegativeProfitGrowth ? styles.badgeDown : styles.badgeNeutral}`}>
                                    {isPositiveProfitGrowth ? <FiTrendingUp /> : isNegativeProfitGrowth ? <FiTrendingDown /> : <FiMinus />}
                                    {m.profitGrowthPercentage > 0 ? `+${m.profitGrowthPercentage}%` : `${m.profitGrowthPercentage}%`}
                                  </span>
                                ) : (
                                  <span style={{ color: '#94a3b8' }}>-</span>
                                )}
                              </td>
                              <td>
                                {m.marginChangePoints !== null ? (
                                  <span style={{ 
                                    fontWeight: 500,
                                    color: m.marginChangePoints > 0 ? '#16a34a' : m.marginChangePoints < 0 ? '#dc2626' : '#64748b' 
                                  }}>
                                    {m.marginChangePoints > 0 ? `+${m.marginChangePoints}%` : `${m.marginChangePoints}%`}
                                  </span>
                                ) : (
                                  <span style={{ color: '#94a3b8' }}>-</span>
                                )}
                              </td>
                              <td>
                                {m.topVariants && m.topVariants.length > 0 ? (
                                  <button
                                    className={styles.expandBtn}
                                    onClick={() => setExpandedMonth(isExpanded ? null : m.month)}
                                  >
                                    {isExpanded ? (
                                      <>Hide <FiChevronUp /></>
                                    ) : (
                                      <>Variants ({m.topVariants.length}) <FiChevronDown /></>
                                    )}
                                  </button>
                                ) : (
                                  <span style={{ color: '#cbd5e1' }}>—</span>
                                )}
                              </td>
                            </tr>

                            {/* Subrow for Top Variants Breakdown */}
                            {isExpanded && m.topVariants && m.topVariants.length > 0 && (
                              <tr className={styles.variantSubRow}>
                                <td colSpan={10}>
                                  <div className={styles.variantSubContainer}>
                                    <div className={styles.variantSubTitle}>
                                      <FiLayers style={{ marginRight: 6 }} />
                                      Top Selling Variants in {m.monthName} (Selling Price vs Cost Price Breakdown)
                                    </div>
                                    <div className={styles.variantGrid}>
                                      {m.topVariants.map((v) => (
                                        <div key={v.variantId} className={styles.variantItemCard}>
                                          <div className={styles.variantItemName}>{v.productName}</div>
                                          <div className={styles.variantItemSku}>SKU: {v.sku}</div>
                                          <div className={styles.variantItemMetrics}>
                                            <span>Price: {formatMMK(v.unitPrice)}</span>
                                            <span>Cost: {formatMMK(v.costPrice)}</span>
                                          </div>
                                          <div className={styles.variantItemMetrics} style={{ marginTop: 4, fontWeight: 600 }}>
                                            <span>Sold: {v.qtySold} pcs</span>
                                            <span style={{ color: '#16a34a' }}>Profit: {formatMMK(v.totalProfit)} ({v.marginPercentage}%)</span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};
