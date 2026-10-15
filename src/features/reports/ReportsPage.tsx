import { useState } from 'react';
import { 
  FiDownload, 
  FiBarChart2, 
  FiPieChart, 
  FiTrendingUp, 
  FiRefreshCcw,
  FiAlertTriangle,
  FiCheckCircle,
  FiAlertCircle,
  FiTruck
} from 'react-icons/fi';
import styles from './ReportsPage.module.css';
import api from '../../utils/axiosConfig';

// Helper to get local date string YYYY-MM-DD
const getTodayString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const ReportsPage = () => {
  const todayStr = getTodayString();
  const firstDayOfMonth = `${todayStr.slice(0, 7)}-01`;

  const [salesStartDate, setSalesStartDate] = useState(firstDayOfMonth);
  const [salesEndDate, setSalesEndDate] = useState(todayStr);
  const [formatDaily, setFormatDaily] = useState('pdf');
  
  const [refundStartDate, setRefundStartDate] = useState(firstDayOfMonth);
  const [refundEndDate, setRefundEndDate] = useState(todayStr);
  const [formatRefund, setFormatRefund] = useState('pdf');
  
  const [fulfillmentStartDate, setFulfillmentStartDate] = useState(firstDayOfMonth);
  const [fulfillmentEndDate, setFulfillmentEndDate] = useState(todayStr);
  const [fulfillmentStatus, setFulfillmentStatus] = useState('ALL');
  const [formatFulfillment, setFormatFulfillment] = useState('pdf');

  const [topSellingLimit, setTopSellingLimit] = useState<number | string>(10);
  const [formatTopSelling, setFormatTopSelling] = useState('pdf');
  
  const [formatCategory, setFormatCategory] = useState('pdf');
  const [formatLowStock, setFormatLowStock] = useState('pdf');
  
  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  const [downloadingFormat, setDownloadingFormat] = useState<string>('pdf');
  const [downloadTitle, setDownloadTitle] = useState<string>('');
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  // Validation: Daily Product Sales
  const getDailySalesError = (): string | null => {
    if (!salesStartDate) return 'Start date is required.';
    if (!salesEndDate) return 'End date is required.';
    if (salesStartDate > todayStr) {
      return "Start date cannot be in the future (cannot exceed today's date).";
    }
    if (salesEndDate > todayStr) {
      return "End date cannot be in the future (cannot exceed today's date).";
    }
    if (salesStartDate > salesEndDate) {
      return 'Start date cannot be after End date (End date must be on or after Start date).';
    }
    return null;
  };
  const dailySalesError = getDailySalesError();

  // Validation: Refund & Return Analysis
  const getRefundError = (): string | null => {
    if (!refundStartDate) return 'Start date is required.';
    if (!refundEndDate) return 'End date is required.';
    if (refundStartDate > todayStr) {
      return "Start date cannot be in the future (cannot exceed today's date).";
    }
    if (refundEndDate > todayStr) {
      return "End date cannot be in the future (cannot exceed today's date).";
    }
    if (refundStartDate > refundEndDate) {
      return 'Start date cannot be after End date (End date must be on or after Start date).';
    }
    return null;
  };
  const refundError = getRefundError();

  // Validation: Order Fulfillment Status
  const getFulfillmentError = (): string | null => {
    if (!fulfillmentStartDate) return 'Start date is required.';
    if (!fulfillmentEndDate) return 'End date is required.';
    if (fulfillmentStartDate > todayStr) {
      return "Start date cannot be in the future (cannot exceed today's date).";
    }
    if (fulfillmentEndDate > todayStr) {
      return "End date cannot be in the future (cannot exceed today's date).";
    }
    if (fulfillmentStartDate > fulfillmentEndDate) {
      return 'Start date cannot be after End date (End date must be on or after Start date).';
    }
    return null;
  };
  const fulfillmentError = getFulfillmentError();

  // Validation: Top Selling Products
  const getTopSellingError = (): string | null => {
    if (topSellingLimit === undefined || topSellingLimit === null || String(topSellingLimit).trim() === '') {
      return 'Please enter the number of products.';
    }
    const num = Number(topSellingLimit);
    if (isNaN(num)) {
      return 'Please enter a valid number.';
    }
    if (!Number.isInteger(num)) {
      return 'Number of products must be a whole number.';
    }
    if (num < 1) {
      return 'Minimum limit is 1 product.';
    }
    if (num > 100) {
      return 'Maximum limit is 100 products.';
    }
    return null;
  };
  const topSellingError = getTopSellingError();

  const downloadReport = async (path: string, reportName: string, exportFormat: string, reportTitle: string) => {
    try {
      setIsDownloading(reportName);
      setDownloadingFormat(exportFormat);
      setDownloadTitle(reportTitle);
      
      const response = await api.get(`/reports${path}`, { 
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { 
        type: exportFormat === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      const extension = exportFormat === 'pdf' ? 'pdf' : 'xlsx';
      
      link.setAttribute('download', `${reportName}.${extension}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      // Trigger success feedback
      setDownloadSuccess(`${reportTitle} (${exportFormat.toUpperCase()})`);
      setTimeout(() => setDownloadSuccess(null), 3500);
    } catch (error: any) {
      console.error('Failed to download report', error);
      const status = error.response?.status;
      if (status === 400) {
        let msg = 'Invalid request parameters.';
        if (error.response?.data instanceof Blob) {
          try {
            msg = await error.response.data.text();
          } catch (e) {
            // fallback
          }
        } else if (typeof error.response?.data === 'string') {
          msg = error.response.data;
        }
        alert(`Validation Error: ${msg}`);
      } else if (status === 401 || status === 403) {
        alert('Permission / Session error (403/401). Please re-login to your admin account or ensure Spring Boot is restarted.');
      } else if (status === 404) {
        alert('Report endpoint or template not found (404).');
      } else {
        alert(`Failed to download report (${status ? 'Error ' + status : 'Network Error'}). Please check the backend console.`);
      }
    } finally {
      setIsDownloading(null);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <header className={styles.headerSection}>
        <div className={styles.titleArea}>
          <h1>Reports & Analytics</h1>
          <p>Generate and export comprehensive insights for your e-commerce operations.</p>
        </div>
      </header>

      <div className={styles.reportGrid}>
        
        {/* 1. Daily Product Sales Report */}
        <div className={`${styles.reportCard} ${styles.cardSales}`}>
          <div className={styles.cardHeader}>
            <div className={styles.iconWrapper}><FiBarChart2 /></div>
            <h3>Daily Product Sales</h3>
          </div>
          <p className={styles.cardDescription}>
            Track daily revenue and units sold across your entire catalog within a specific timeframe.
          </p>
          <div className={styles.inputGroup}>
            <div className={styles.dateInputWrapper}>
              <span className={styles.inputLabel}>Start Date</span>
              <input 
                type="date" 
                className={`${styles.styledInput} ${dailySalesError && (!salesStartDate || salesStartDate > salesEndDate || salesStartDate > todayStr) ? styles.inputError : ''}`} 
                value={salesStartDate} 
                max={salesEndDate && salesEndDate < todayStr ? salesEndDate : todayStr}
                onChange={(e) => setSalesStartDate(e.target.value)} 
              />
            </div>
            <div className={styles.dateInputWrapper}>
              <span className={styles.inputLabel}>End Date</span>
              <input 
                type="date" 
                className={`${styles.styledInput} ${dailySalesError && (!salesEndDate || salesStartDate > salesEndDate || salesEndDate > todayStr) ? styles.inputError : ''}`} 
                value={salesEndDate} 
                min={salesStartDate || undefined}
                max={todayStr}
                onChange={(e) => setSalesEndDate(e.target.value)} 
              />
            </div>
          </div>
          {dailySalesError && (
            <div className={styles.errorMessage}>
              <FiAlertCircle />
              <span>{dailySalesError}</span>
            </div>
          )}
          <div className={styles.exportActionRow}>
            <select 
              className={styles.cardFormatSelect} 
              value={formatDaily} 
              onChange={(e) => setFormatDaily(e.target.value)}
            >
              <option value="pdf">PDF</option>
              <option value="excel">Excel</option>
            </select>
            <button 
              className={`${styles.downloadBtn} ${isDownloading === 'daily-sales' ? styles.downloadBtnLoading : ''}`}
              disabled={isDownloading === 'daily-sales' || !!dailySalesError}
              onClick={() => {
                if (dailySalesError) return;
                downloadReport(`/daily-product-sales?startDate=${salesStartDate}&endDate=${salesEndDate}&format=${formatDaily}`, 'daily-sales', formatDaily, 'Daily Product Sales');
              }}
            >
              {isDownloading === 'daily-sales' ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                  <span>Exporting {formatDaily.toUpperCase()}...</span>
                </>
              ) : (
                <>
                  <FiDownload />
                  <span>Export</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 2. Category Summary Report */}
        <div className={`${styles.reportCard} ${styles.cardCategory}`}>
          <div className={styles.cardHeader}>
            <div className={styles.iconWrapper}><FiPieChart /></div>
            <h3>Category Summary</h3>
          </div>
          <p className={styles.cardDescription}>
            Get a high-level overview of product distribution, active item counts, and statuses across all categories.
          </p>
          <div className={styles.badge}>
            Instant Snapshot (No parameters required)
          </div>
          <div className={styles.exportActionRow}>
            <select 
              className={styles.cardFormatSelect} 
              value={formatCategory} 
              onChange={(e) => setFormatCategory(e.target.value)}
            >
              <option value="pdf">PDF</option>
              <option value="excel">Excel</option>
            </select>
            <button 
              className={`${styles.downloadBtn} ${isDownloading === 'category-summary' ? styles.downloadBtnLoading : ''}`}
              disabled={isDownloading === 'category-summary'}
              onClick={() => downloadReport(`/categories?format=${formatCategory}`, 'category-summary', formatCategory, 'Category Summary')}
            >
              {isDownloading === 'category-summary' ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                  <span>Exporting {formatCategory.toUpperCase()}...</span>
                </>
              ) : (
                <>
                  <FiDownload />
                  <span>Export</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 3. Top Selling Products Report */}
        <div className={`${styles.reportCard} ${styles.cardTrending}`}>
          <div className={styles.cardHeader}>
            <div className={styles.iconWrapper}><FiTrendingUp /></div>
            <h3>Top Performing Products</h3>
          </div>
          <p className={styles.cardDescription}>
            Identify your most popular products ranked by overall sales volume to boost your marketing strategy.
          </p>
          <div className={styles.inputGroup}>
            <div className={styles.numberInputWrapper}>
              <span className={styles.inputLabel}>Number of Products to show (1 - 100)</span>
              <input 
                type="number" 
                className={`${styles.styledInput} ${topSellingError ? styles.inputError : ''}`} 
                min="1" 
                max="100" 
                step="1"
                value={topSellingLimit} 
                onChange={(e) => setTopSellingLimit(e.target.value === '' ? '' : Number(e.target.value))} 
              />
            </div>
          </div>
          {topSellingError && (
            <div className={styles.errorMessage}>
              <FiAlertCircle />
              <span>{topSellingError}</span>
            </div>
          )}
          <div className={styles.exportActionRow}>
            <select 
              className={styles.cardFormatSelect} 
              value={formatTopSelling} 
              onChange={(e) => setFormatTopSelling(e.target.value)}
            >
              <option value="pdf">PDF</option>
              <option value="excel">Excel</option>
            </select>
            <button 
              className={`${styles.downloadBtn} ${isDownloading === 'top-selling' ? styles.downloadBtnLoading : ''}`}
              disabled={isDownloading === 'top-selling' || !!topSellingError}
              onClick={() => {
                if (topSellingError) return;
                downloadReport(`/top-selling?limitCount=${topSellingLimit}&format=${formatTopSelling}`, 'top-selling', formatTopSelling, 'Top Selling Products');
              }}
            >
              {isDownloading === 'top-selling' ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                  <span>Exporting {formatTopSelling.toUpperCase()}...</span>
                </>
              ) : (
                <>
                  <FiDownload />
                  <span>Export</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 4. Refund Summary Report */}
        <div className={`${styles.reportCard} ${styles.cardRefund}`}>
          <div className={styles.cardHeader}>
            <div className={styles.iconWrapper}><FiRefreshCcw /></div>
            <h3>Refund & Return Analysis</h3>
          </div>
          <p className={styles.cardDescription}>
            Review customer refund requests, return reasons, and financial impact over a selected period.
          </p>
          <div className={styles.inputGroup}>
            <div className={styles.dateInputWrapper}>
              <span className={styles.inputLabel}>Start Date</span>
              <input 
                type="date" 
                className={`${styles.styledInput} ${refundError && (!refundStartDate || refundStartDate > refundEndDate || refundStartDate > todayStr) ? styles.inputError : ''}`} 
                value={refundStartDate} 
                max={refundEndDate && refundEndDate < todayStr ? refundEndDate : todayStr}
                onChange={(e) => setRefundStartDate(e.target.value)} 
              />
            </div>
            <div className={styles.dateInputWrapper}>
              <span className={styles.inputLabel}>End Date</span>
              <input 
                type="date" 
                className={`${styles.styledInput} ${refundError && (!refundEndDate || refundStartDate > refundEndDate || refundEndDate > todayStr) ? styles.inputError : ''}`} 
                value={refundEndDate} 
                min={refundStartDate || undefined}
                max={todayStr}
                onChange={(e) => setRefundEndDate(e.target.value)} 
              />
            </div>
          </div>
          {refundError && (
            <div className={styles.errorMessage}>
              <FiAlertCircle />
              <span>{refundError}</span>
            </div>
          )}
          <div className={styles.exportActionRow}>
            <select 
              className={styles.cardFormatSelect} 
              value={formatRefund} 
              onChange={(e) => setFormatRefund(e.target.value)}
            >
              <option value="pdf">PDF</option>
              <option value="excel">Excel</option>
            </select>
            <button 
              className={`${styles.downloadBtn} ${isDownloading === 'refund-summary' ? styles.downloadBtnLoading : ''}`}
              disabled={isDownloading === 'refund-summary' || !!refundError}
              onClick={() => {
                if (refundError) return;
                downloadReport(`/refund-summary?startDate=${refundStartDate}&endDate=${refundEndDate}&format=${formatRefund}`, 'refund-summary', formatRefund, 'Refund Summary');
              }}
            >
              {isDownloading === 'refund-summary' ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                  <span>Exporting {formatRefund.toUpperCase()}...</span>
                </>
              ) : (
                <>
                  <FiDownload />
                  <span>Export</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 5. Low Stock Alert Report */}
        <div className={`${styles.reportCard} ${styles.cardAlert}`}>
          <div className={styles.cardHeader}>
            <div className={styles.iconWrapper}><FiAlertTriangle /></div>
            <h3>Critical Inventory Alerts</h3>
          </div>
          <p className={styles.cardDescription}>
            Instantly view items that have fallen below their minimum reorder thresholds to prevent stockouts.
          </p>
          <div className={styles.badge}>
            Live Stock Check (Real-time data)
          </div>
          <div className={styles.exportActionRow}>
            <select 
              className={styles.cardFormatSelect} 
              value={formatLowStock} 
              onChange={(e) => setFormatLowStock(e.target.value)}
            >
              <option value="pdf">PDF</option>
              <option value="excel">Excel</option>
            </select>
            <button 
              className={`${styles.downloadBtn} ${isDownloading === 'low-stock' ? styles.downloadBtnLoading : ''}`}
              disabled={isDownloading === 'low-stock'}
              onClick={() => downloadReport(`/low-stock?format=${formatLowStock}`, 'low-stock', formatLowStock, 'Critical Inventory Alerts')}
            >
              {isDownloading === 'low-stock' ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                  <span>Exporting {formatLowStock.toUpperCase()}...</span>
                </>
              ) : (
                <>
                  <FiDownload />
                  <span>Export</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 6. Order Fulfillment Status Report */}
        <div className={`${styles.reportCard} ${styles.cardFulfillment}`}>
          <div className={styles.cardHeader}>
            <div className={styles.iconWrapper}><FiTruck /></div>
            <h3>Order Fulfillment Status</h3>
          </div>
          <p className={styles.cardDescription}>
            Monitor order processing cycles, payment verification, and delivery fulfillment across custom statuses.
          </p>
          <div className={styles.inputGroup}>
            <div className={styles.dateInputWrapper}>
              <span className={styles.inputLabel}>Start Date</span>
              <input 
                type="date" 
                className={`${styles.styledInput} ${fulfillmentError && (!fulfillmentStartDate || fulfillmentStartDate > fulfillmentEndDate || fulfillmentStartDate > todayStr) ? styles.inputError : ''}`} 
                value={fulfillmentStartDate} 
                max={fulfillmentEndDate && fulfillmentEndDate < todayStr ? fulfillmentEndDate : todayStr}
                onChange={(e) => setFulfillmentStartDate(e.target.value)} 
              />
            </div>
            <div className={styles.dateInputWrapper}>
              <span className={styles.inputLabel}>End Date</span>
              <input 
                type="date" 
                className={`${styles.styledInput} ${fulfillmentError && (!fulfillmentEndDate || fulfillmentStartDate > fulfillmentEndDate || fulfillmentEndDate > todayStr) ? styles.inputError : ''}`} 
                value={fulfillmentEndDate} 
                min={fulfillmentStartDate || undefined}
                max={todayStr}
                onChange={(e) => setFulfillmentEndDate(e.target.value)} 
              />
            </div>
          </div>
          <div className={styles.inputGroup} style={{ marginTop: '-12px' }}>
            <div className={styles.dateInputWrapper}>
              <span className={styles.inputLabel}>Fulfillment Status</span>
              <select 
                className={styles.styledInput} 
                value={fulfillmentStatus} 
                onChange={(e) => setFulfillmentStatus(e.target.value)}
              >
                <option value="ALL">All Statuses (ALL)</option>
                <option value="PENDING">PENDING</option>
                <option value="PROCESSING">PROCESSING</option>
                <option value="SHIPPED">SHIPPED</option>
                <option value="DELIVERED">DELIVERED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>
          </div>
          {fulfillmentError && (
            <div className={styles.errorMessage}>
              <FiAlertCircle />
              <span>{fulfillmentError}</span>
            </div>
          )}
          <div className={styles.exportActionRow}>
            <select 
              className={styles.cardFormatSelect} 
              value={formatFulfillment} 
              onChange={(e) => setFormatFulfillment(e.target.value)}
            >
              <option value="pdf">PDF</option>
              <option value="excel">Excel</option>
            </select>
            <button 
              className={`${styles.downloadBtn} ${isDownloading === 'order-fulfillment' ? styles.downloadBtnLoading : ''}`}
              disabled={isDownloading === 'order-fulfillment' || !!fulfillmentError}
              onClick={() => {
                if (fulfillmentError) return;
                downloadReport(
                  `/order-fulfillment?startDate=${fulfillmentStartDate}&endDate=${fulfillmentEndDate}&status=${fulfillmentStatus}&format=${formatFulfillment}`,
                  'order-fulfillment',
                  formatFulfillment,
                  'Order Fulfillment Status'
                );
              }}
            >
              {isDownloading === 'order-fulfillment' ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                  <span>Exporting {formatFulfillment.toUpperCase()}...</span>
                </>
              ) : (
                <>
                  <FiDownload />
                  <span>Export</span>
                </>
              )}
            </button>
          </div>
        </div>
        
      </div>

      {/* Floating Export Progress Animation HUD */}
      {isDownloading && (
        <div className={styles.exportProgressOverlay}>
          <div className={styles.exportProgressCard}>
            <div className={styles.spinnerWrapper}>
              <div className={styles.circularSpinner} />
              <span className={styles.formatBadge}>
                {downloadingFormat === 'pdf' ? 'PDF' : 'XLS'}
              </span>
            </div>
            <div className={styles.exportProgressText}>
              <h4>Generating {downloadTitle}</h4>
              <p>Compiling analytics data & formatting {downloadingFormat.toUpperCase()} document...</p>
              <div className={styles.progressBarTrack}>
                <div className={styles.progressBarFill} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Download Toast */}
      {downloadSuccess && (
        <div className={styles.successToast}>
          <FiCheckCircle className={styles.successIcon} />
          <span>{downloadSuccess} ready & downloaded!</span>
        </div>
      )}
    </div>
  );
};
