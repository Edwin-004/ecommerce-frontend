import React, { useState } from 'react';
import { FiDownload, FiBarChart2, FiPieChart, FiTrendingUp, FiAlertCircle, FiRefreshCcw } from 'react-icons/fi';
import styles from './ReportsPage.module.css';
import api from '../../utils/axiosConfig';

export const ReportsPage = () => {
  const [startDate, setStartDate] = useState('2026-10-01');
  const [endDate, setEndDate] = useState('2026-10-31');
  const [limit, setLimit] = useState(10);
  const [format, setFormat] = useState('pdf');

  const downloadReport = async (url: string) => {
    try {
      const response = await api.get(url, { responseType: 'blob' });
      const blob = new Blob([response.data], { 
        type: format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      const extension = format === 'pdf' ? 'pdf' : 'xlsx';
      
      let filename = 'report';
      if(url.includes('daily')) filename = 'daily-sales';
      else if(url.includes('categories')) filename = 'category-summary';
      else if(url.includes('top-selling')) filename = 'top-selling';
      else if(url.includes('refunds')) filename = 'refund-summary';
      else if(url.includes('low-stock')) filename = 'low-stock';

      link.setAttribute('download', `${filename}.${extension}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Failed to download report', error);
      alert('Failed to download the report. Please try again or check your permissions.');
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>System Reports</h1>
        <div className={styles.globalControls}>
          <label>
            Export Format:
            <select value={format} onChange={(e) => setFormat(e.target.value)}>
              <option value="pdf">PDF</option>
              <option value="excel">Excel</option>
            </select>
          </label>
        </div>
      </header>

      <div className={styles.grid}>
        {/* 1. Daily Product Sales Report */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <FiBarChart2 className={styles.icon} />
            <h2>Daily Product Sales</h2>
          </div>
          <p>Generate a report of daily product sales within a date range.</p>
          <div className={styles.controls}>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <button 
            className={styles.button}
            onClick={() => downloadReport(`/reports/daily-product-sales?startDate=${startDate}&endDate=${endDate}&format=${format}`)}>
            <FiDownload /> Download Report
          </button>
        </div>

        {/* 2. Category Summary Report */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <FiPieChart className={styles.icon} />
            <h2>Category Summary</h2>
          </div>
          <p>Get a summary of products categorized by their active/inactive status.</p>
          <div className={styles.controls}>
            <span className={styles.placeholder}>No date range required</span>
          </div>
          <button 
            className={styles.button}
            onClick={() => downloadReport(`/reports/categories?format=${format}`)}>
            <FiDownload /> Download Report
          </button>
        </div>

        {/* 3. Top Selling Products Report */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <FiTrendingUp className={styles.icon} />
            <h2>Top Selling Products</h2>
          </div>
          <p>View the top-performing products by total quantity sold.</p>
          <div className={styles.controls}>
            <label>
              Limit:
              <input type="number" min="1" max="100" value={limit} onChange={(e) => setLimit(Number(e.target.value))} />
            </label>
          </div>
          <button 
            className={styles.button}
            onClick={() => downloadReport(`/reports/top-selling?limitCount=${limit}&format=${format}`)}>
            <FiDownload /> Download Report
          </button>
        </div>

        {/* 4. Refund Summary Report */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <FiRefreshCcw className={styles.icon} />
            <h2>Refund Summary</h2>
          </div>
          <p>Analyze refund and return requests within a specific period.</p>
          <div className={styles.controls}>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <button 
            className={styles.button}
            onClick={() => downloadReport(`/reports/refunds?startDate=${startDate}&endDate=${endDate}&format=${format}`)}>
            <FiDownload /> Download Report
          </button>
        </div>

        {/* 5. Low Stock Alert Report */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <FiAlertCircle className={styles.icon} />
            <h2>Low Stock Alert</h2>
          </div>
          <p>Identify products that are low on stock or completely out of stock.</p>
          <div className={styles.controls}>
            <span className={styles.placeholder}>Real-time inventory check</span>
          </div>
          <button 
            className={styles.button}
            onClick={() => downloadReport(`/reports/low-stock?format=${format}`)}>
            <FiDownload /> Download Report
          </button>
        </div>
      </div>
    </div>
  );
};
