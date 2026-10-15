import { useState } from 'react';
import { 
  FiDownload, 
  FiBarChart2, 
  FiPieChart, 
  FiTrendingUp, 
  FiRefreshCcw,
  FiAlertTriangle,
  FiLoader,
  FiCheckCircle
} from 'react-icons/fi';
import styles from './ReportsPage.module.css';
import api from '../../utils/axiosConfig';

export const ReportsPage = () => {
  const [salesStartDate, setSalesStartDate] = useState('2026-10-01');
  const [salesEndDate, setSalesEndDate] = useState('2026-10-31');
  const [formatDaily, setFormatDaily] = useState('pdf');
  
  const [refundStartDate, setRefundStartDate] = useState('2026-10-01');
  const [refundEndDate, setRefundEndDate] = useState('2026-10-31');
  const [formatRefund, setFormatRefund] = useState('pdf');
  
  const [topSellingLimit, setTopSellingLimit] = useState(10);
  const [formatTopSelling, setFormatTopSelling] = useState('pdf');
  
  const [formatCategory, setFormatCategory] = useState('pdf');
  const [formatLowStock, setFormatLowStock] = useState('pdf');
  
  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  const [downloadingFormat, setDownloadingFormat] = useState<string>('pdf');
  const [downloadTitle, setDownloadTitle] = useState<string>('');
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

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
      if (status === 401 || status === 403) {
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
                className={styles.styledInput} 
                value={salesStartDate} 
                onChange={(e) => setSalesStartDate(e.target.value)} 
              />
            </div>
            <div className={styles.dateInputWrapper}>
              <span className={styles.inputLabel}>End Date</span>
              <input 
                type="date" 
                className={styles.styledInput} 
                value={salesEndDate} 
                onChange={(e) => setSalesEndDate(e.target.value)} 
              />
            </div>
          </div>
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
              disabled={isDownloading === 'daily-sales'}
              onClick={() => downloadReport(`/daily-product-sales?startDate=${salesStartDate}&endDate=${salesEndDate}&format=${formatDaily}`, 'daily-sales', formatDaily, 'Daily Product Sales')}
            >
              {isDownloading === 'daily-sales' ? (
                <>
                  <FiLoader className={styles.spinnerIcon} />
                  <span>Generating {formatDaily.toUpperCase()}...</span>
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
                  <FiLoader className={styles.spinnerIcon} />
                  <span>Generating {formatCategory.toUpperCase()}...</span>
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
              <span className={styles.inputLabel}>Number of Products to show</span>
              <input 
                type="number" 
                className={styles.styledInput} 
                min="1" 
                max="100" 
                value={topSellingLimit} 
                onChange={(e) => setTopSellingLimit(Number(e.target.value))} 
              />
            </div>
          </div>
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
              disabled={isDownloading === 'top-selling'}
              onClick={() => downloadReport(`/top-selling?limitCount=${topSellingLimit}&format=${formatTopSelling}`, 'top-selling', formatTopSelling, 'Top Selling Products')}
            >
              {isDownloading === 'top-selling' ? (
                <>
                  <FiLoader className={styles.spinnerIcon} />
                  <span>Generating {formatTopSelling.toUpperCase()}...</span>
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
                className={styles.styledInput} 
                value={refundStartDate} 
                onChange={(e) => setRefundStartDate(e.target.value)} 
              />
            </div>
            <div className={styles.dateInputWrapper}>
              <span className={styles.inputLabel}>End Date</span>
              <input 
                type="date" 
                className={styles.styledInput} 
                value={refundEndDate} 
                onChange={(e) => setRefundEndDate(e.target.value)} 
              />
            </div>
          </div>
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
              disabled={isDownloading === 'refund-summary'}
              onClick={() => downloadReport(`/refund-summary?startDate=${refundStartDate}&endDate=${refundEndDate}&format=${formatRefund}`, 'refund-summary', formatRefund, 'Refund Summary')}
            >
              {isDownloading === 'refund-summary' ? (
                <>
                  <FiLoader className={styles.spinnerIcon} />
                  <span>Generating {formatRefund.toUpperCase()}...</span>
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
                  <FiLoader className={styles.spinnerIcon} />
                  <span>Generating {formatLowStock.toUpperCase()}...</span>
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
