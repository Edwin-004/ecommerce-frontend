import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import type { RootState, AppDispatch } from '../../store'; 
import { fetchAuditLogs } from './auditLogSlice';
import type { AuditLog as AuditLogType } from '../../types/auditLog';
import './AuditLog.css'; 

const AuditLog: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { logs, loading, error } = useSelector((state: RootState) => state.auditLog);

  // Date Filter States
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [activePreset, setActivePreset] = useState<string>('all');

  // Search & Action Filter States
  const [selectedAction, setSelectedAction] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Pagination States
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  // Custom Modal State
  const [selectedLog, setSelectedLog] = useState<AuditLogType | null>(null);

  useEffect(() => {
    dispatch(fetchAuditLogs());
  }, [dispatch]);

  // Reset to first page whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedAction, searchQuery, startDate, endDate, itemsPerPage]);

  const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDateTimeDMY = (dateString?: string): string => {
    if (!dateString) return '-';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '-';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${day}/${month}/${year}, ${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
  };

  // Quick Preset Handlers
  const handlePresetAll = () => {
    setActivePreset('all');
    setStartDate('');
    setEndDate('');
    dispatch(fetchAuditLogs());
  };

  const handlePresetToday = () => {
    const today = formatDateForInput(new Date());
    setActivePreset('today');
    setStartDate(today);
    setEndDate(today);
    dispatch(fetchAuditLogs({ startDate: today, endDate: today }));
  };

  const handlePresetLast7Days = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 7);
    const startStr = formatDateForInput(start);
    const endStr = formatDateForInput(end);

    setActivePreset('7days');
    setStartDate(startStr);
    setEndDate(endStr);
    dispatch(fetchAuditLogs({ startDate: startStr, endDate: endStr }));
  };

  const handlePresetLast30Days = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 30);
    const startStr = formatDateForInput(start);
    const endStr = formatDateForInput(end);

    setActivePreset('30days');
    setStartDate(startStr);
    setEndDate(endStr);
    dispatch(fetchAuditLogs({ startDate: startStr, endDate: endStr }));
  };

  // Custom Date Filter Submit
  const handleApplyFilter = (e: React.FormEvent) => {
    e.preventDefault();
    if (startDate && endDate && startDate > endDate) {
      toast.warning('Start Date cannot be later than End Date.');
      return;
    }
    setActivePreset('custom');
    dispatch(fetchAuditLogs({ startDate, endDate }));
  };

  const handleReset = () => {
    setActivePreset('all');
    setStartDate('');
    setEndDate('');
    setSelectedAction('ALL');
    setSearchQuery('');
    dispatch(fetchAuditLogs());
  };

  // Action Badge CSS Class
  const getActionBadgeClass = (action: string) => {
    const act = action?.toUpperCase();
    if (act === 'LOGIN') return 'badge-login';
    if (act === 'LOGOUT') return 'badge-logout';
    if (act === 'CREATE') return 'badge-create';
    if (act === 'UPDATE') return 'badge-update';
    if (act === 'DELETE') return 'badge-delete';
    return 'badge-default';
  };

  // JSON Pretty Print Helper
  const formatJSON = (value: string | undefined | null) => {
    if (!value) return 'No data / Not applicable';
    try {
      const parsed = JSON.parse(value);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return value;
    }
  };

  // Filter logs by action and search query
  const filteredLogs = logs.filter((log) => {
    if (selectedAction !== 'ALL' && log.action?.toUpperCase() !== selectedAction) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const matchUser = log.userName?.toLowerCase().includes(q);
      const matchModule = log.moduleName?.toLowerCase().includes(q);
      const matchDesc = log.description?.toLowerCase().includes(q);
      const matchIp = log.ipAddress?.toLowerCase().includes(q);
      const matchId = String(log.id).includes(q);
      if (!matchUser && !matchModule && !matchDesc && !matchIp && !matchId) {
        return false;
      }
    }
    return true;
  });

  // Pagination Calculations
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedLogs = filteredLogs.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="audit-container">
      {/* Header */}
      <div className="audit-header">
        <div>
          <h2 className="audit-title">System Audit Logs</h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '13.5px', color: '#6b7280' }}>
            Track and monitor administrative events, staff actions, and security logs.
          </p>
        </div>
      </div>

      {/* Filter Card */}
      <div className="audit-filter-card">
        {/* Presets */}
        <div className="filter-preset-row">
          <span className="preset-label">Quick Filter:</span>
          <button 
            type="button"
            className={`btn-preset ${activePreset === 'all' ? 'active' : ''}`}
            onClick={handlePresetAll}
          >
            All Time
          </button>
          <button 
            type="button"
            className={`btn-preset ${activePreset === 'today' ? 'active' : ''}`}
            onClick={handlePresetToday}
          >
            Today
          </button>
          <button 
            type="button"
            className={`btn-preset ${activePreset === '7days' ? 'active' : ''}`}
            onClick={handlePresetLast7Days}
          >
            Last 7 Days
          </button>
          <button 
            type="button"
            className={`btn-preset ${activePreset === '30days' ? 'active' : ''}`}
            onClick={handlePresetLast30Days}
          >
            Last 30 Days
          </button>
        </div>

        {/* Date Inputs Form */}
        <form onSubmit={handleApplyFilter} className="filter-inputs-row">
          <div className="filter-group">
            <label htmlFor="startDate">From Date</label>
            <input 
              id="startDate"
              type="date"
              className="filter-input"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setActivePreset('custom');
              }}
            />
          </div>

          <div className="filter-group">
            <label htmlFor="endDate">To Date</label>
            <input 
              id="endDate"
              type="date"
              className="filter-input"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setActivePreset('custom');
              }}
            />
          </div>

          <div className="filter-actions">
            <button type="submit" className="btn-filter" disabled={loading}>
              {loading ? 'Filtering...' : 'Apply Date'}
            </button>
            <button 
              type="button" 
              className="btn-reset" 
              onClick={handleReset}
              disabled={loading && !startDate && !endDate && selectedAction === 'ALL' && !searchQuery}
            >
              Reset All
            </button>
          </div>
        </form>

        {/* Search & Action Filter Controls */}
        <div className="audit-controls-row">
          <input
            type="text"
            className="audit-search-input"
            placeholder="Search by username, module, description, or IP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <select
            className="audit-select"
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
          >
            <option value="ALL">All Actions</option>
            <option value="LOGIN">LOGIN</option>
            <option value="LOGOUT">LOGOUT</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
          </select>

          <select
            className="audit-select"
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
          >
            <option value={10}>10 per page</option>
            <option value={20}>20 per page</option>
            <option value={50}>50 per page</option>
          </select>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="error-banner">
          <strong>Error loading audit logs:</strong> {error}
        </div>
      )}

      {/* Stats Bar */}
      <div className="audit-stats-bar">
        <div>
          Showing <strong>{filteredLogs.length}</strong> of <strong>{logs.length}</strong> total records
          {(startDate || endDate) && (
            <span className="active-filter-badge" style={{ marginLeft: '10px' }}>
              Date: {startDate || 'Beginning'} &rarr; {endDate || 'Now'}
            </span>
          )}
          {selectedAction !== 'ALL' && (
            <span className="active-filter-badge" style={{ marginLeft: '8px' }}>
              Action: {selectedAction}
            </span>
          )}
          {searchQuery && (
            <span className="active-filter-badge" style={{ marginLeft: '8px' }}>
              Search: "{searchQuery}"
            </span>
          )}
        </div>
        {loading && <span style={{ color: '#2563eb', fontWeight: '500' }}>Loading...</span>}
      </div>

      {/* Table */}
      <div className="audit-table-wrapper">
        <table className="audit-table">
          <thead>
            <tr>
              <th style={{ width: '60px' }}>ID</th>
              <th>Action</th>
              <th>Module</th>
              <th>Performed By</th>
              <th>IP Address</th>
              <th>Status</th>
              <th>Date & Time</th>
              <th style={{ textAlign: 'center', width: '130px' }}>Details</th>
            </tr>
          </thead>
          <tbody>
            {paginatedLogs.map((log) => (
              <tr key={log.id}>
                <td style={{ color: '#6b7280', fontWeight: '500' }}>#{log.id}</td>
                <td>
                  <span className={`action-badge ${getActionBadgeClass(log.action)}`}>
                    {log.action}
                  </span>
                </td>
                <td><strong>{log.moduleName || '-'}</strong></td>
                <td>
                  <span style={{ fontWeight: '500', color: '#111827' }}>
                    {log.userName || 'SYSTEM'}
                  </span>
                </td>
                <td style={{ color: '#4b5563', fontFamily: 'monospace', fontSize: '12.5px' }}>
                  {log.ipAddress || '-'}
                </td>
                <td>
                  <span className={`status-badge ${log.status === 'SUCCESS' ? 'status-success' : 'status-error'}`}>
                    {log.status || 'SUCCESS'}
                  </span>
                </td>
                <td style={{ whiteSpace: 'nowrap', color: '#4b5563' }}>
                  {formatDateTimeDMY(log.createdAt)}
                </td>
                <td style={{ textAlign: 'center' }}>
                  <button 
                    type="button"
                    className="btn-view-details"
                    onClick={() => setSelectedLog(log)}
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Empty State */}
        {!loading && filteredLogs.length === 0 && (
          <div className="message-text">
            No audit logs match the current filters.
          </div>
        )}

        {/* Loading Overlay State for initial load */}
        {loading && logs.length === 0 && (
          <div className="message-text">
            Loading audit logs...
          </div>
        )}

        {/* Pagination Bar */}
        {filteredLogs.length > 0 && (
          <div className="pagination-container">
            <div>
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredLogs.length)} of {filteredLogs.length} entries
            </div>
            <div className="pagination-controls">
              <button
                type="button"
                className="btn-page"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
              >
                &larr; Previous
              </button>

              <span style={{ padding: '0 8px', fontWeight: '600', color: '#374151' }}>
                Page {currentPage} of {totalPages}
              </span>

              <button
                type="button"
                className="btn-page"
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage >= totalPages}
              >
                Next &rarr;
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedLog && (
        <div className="audit-modal-overlay" onClick={() => setSelectedLog(null)}>
          <div className="audit-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="audit-modal-header">
              <h3 className="audit-modal-title">Audit Log Details #{selectedLog.id}</h3>
              <button 
                type="button"
                className="audit-modal-close"
                onClick={() => setSelectedLog(null)}
              >
                &times;
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px', fontSize: '13.5px' }}>
              <div><strong>Action:</strong> <span className={`action-badge ${getActionBadgeClass(selectedLog.action)}`} style={{ marginLeft: '6px' }}>{selectedLog.action}</span></div>
              <div><strong>Module:</strong> {selectedLog.moduleName || '-'}</div>
              <div><strong>Performed By:</strong> {selectedLog.userName || 'SYSTEM'} {selectedLog.userId ? `(ID: ${selectedLog.userId})` : ''}</div>
              <div><strong>Date & Time:</strong> {formatDateTimeDMY(selectedLog.createdAt)}</div>
              <div><strong>HTTP Method:</strong> {selectedLog.httpMethod || '-'}</div>
              <div><strong>Endpoint:</strong> {selectedLog.endpoint || '-'}</div>
              <div><strong>IP Address:</strong> {selectedLog.ipAddress || '-'}</div>
              <div>
                <strong>Status:</strong>{' '}
                <span className={`status-badge ${selectedLog.status === 'SUCCESS' ? 'status-success' : 'status-error'}`}>
                  {selectedLog.status || 'SUCCESS'}
                </span>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <strong>Description:</strong> {selectedLog.description || 'No description provided'}
              </div>
            </div>

            {/* Old vs New Value Comparison */}
            <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 6px 0', color: '#b91c1c', fontSize: '13px' }}>
                  Previous State (Old Value)
                </h4>
                <pre style={{
                  backgroundColor: '#f9fafb',
                  padding: '12px',
                  borderRadius: '6px',
                  border: '1px solid #e5e7eb',
                  fontSize: '12.5px',
                  fontFamily: 'monospace',
                  overflowX: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  maxHeight: '350px',
                  overflowY: 'auto'
                }}>
                  {formatJSON(selectedLog.oldValue)}
                </pre>
              </div>

              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 6px 0', color: '#15803d', fontSize: '13px' }}>
                  Updated State (New Value)
                </h4>
                <pre style={{
                  backgroundColor: '#f9fafb',
                  padding: '12px',
                  borderRadius: '6px',
                  border: '1px solid #e5e7eb',
                  fontSize: '12.5px',
                  fontFamily: 'monospace',
                  overflowX: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  maxHeight: '350px',
                  overflowY: 'auto'
                }}>
                  {formatJSON(selectedLog.newValue)}
                </pre>
              </div>
            </div>

            <div style={{ textAlign: 'right', marginTop: '20px' }}>
              <button 
                type="button"
                className="btn-reset"
                onClick={() => setSelectedLog(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLog;
