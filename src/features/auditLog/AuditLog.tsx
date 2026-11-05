import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { 
  FiLogIn, 
  FiLogOut, 
  FiPlusCircle, 
  FiEdit3, 
  FiTrash2, 
  FiActivity, 
  FiUser, 
  FiCalendar, 
  FiGlobe, 
  FiCheckCircle, 
  FiAlertCircle, 
  FiInfo, 
  FiCode, 
  FiFilter, 
  FiLayers 
} from 'react-icons/fi';
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
  const [selectedModule, setSelectedModule] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Pagination States
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  // Custom Modal State
  const [selectedLog, setSelectedLog] = useState<AuditLogType | null>(null);
  const [showRawJson, setShowRawJson] = useState<boolean>(false);
  const [onlyChangedFields, setOnlyChangedFields] = useState<boolean>(true);

  // Dynamic Unique Modules list from fetched logs
  const availableModules = React.useMemo(() => {
    const set = new Set<string>();
    logs.forEach((log) => {
      if (log.moduleName && log.moduleName.trim()) {
        set.add(log.moduleName.trim().toUpperCase());
      }
    });
    return Array.from(set).sort();
  }, [logs]);

  useEffect(() => {
    dispatch(fetchAuditLogs({}));
  }, [dispatch]);

  // Reset to first page whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedAction, selectedModule, searchQuery, startDate, endDate, itemsPerPage]);

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
    dispatch(fetchAuditLogs({}));
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
    setSelectedModule('ALL');
    setSearchQuery('');
    dispatch(fetchAuditLogs({}));
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

  // Safe JSON parser for objects/records
  const tryParseJSON = (str?: string | null): Record<string, any> | null => {
    if (!str || typeof str !== 'string') return null;
    const trimmed = str.trim();
    if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return null;
    try {
      const parsed = JSON.parse(trimmed);
      if (typeof parsed === 'object' && parsed !== null) {
        return parsed;
      }
    } catch {
      return null;
    }
    return null;
  };

  // Technical internal keys that should be filtered out from user-friendly view
  const TECHNICAL_KEYS = new Set([
    'passwordhash',
    'password',
    'tokenversion',
    'mustchangepassword',
    'createdby',
    'modifiedby',
    'class',
    'hibernatelazyinitializer',
    'handler'
  ]);

  const isTechnicalKey = (key: string): boolean => {
    return TECHNICAL_KEYS.has(key.toLowerCase().trim());
  };

  const formatFieldValue = (val: any, key?: string): string => {
    if (val === null || val === undefined) return '—';
    if (typeof val === 'boolean') return val ? 'Yes' : 'No';
    if (typeof val === 'object') return JSON.stringify(val);
    const str = String(val).trim();
    if (key?.toLowerCase() === 'userrole') {
      if (str === 'ADMIN') return 'Administrator';
      if (str === 'INVENTORY_STAFF') return 'Inventory Staff';
      if (str === 'SALES_STAFF') return 'Sales Staff';
    }
    return str;
  };

  const humanizeFieldLabel = (key: string): string => {
    const k = key.trim().toLowerCase();
    if (k === 'username') return 'Staff Username';
    if (k === 'email') return 'Email Address';
    if (k === 'userrole') return 'System Role';
    if (k === 'status') return 'Account Status';
    if (k === 'userid') return 'User ID';
    if (k === 'createdat') return 'Creation Date';
    if (k === 'modifiedat') return 'Last Modified';
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/[_-]/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim();
  };

  const formatIPAddress = (ip?: string): string => {
    if (!ip) return 'Unknown IP';
    const clean = ip.trim();
    if (clean === '0:0:0:0:0:0:0:1' || clean === '::1' || clean === '127.0.0.1') {
      return '127.0.0.1 (Localhost / This PC)';
    }
    return clean;
  };

  const formatTableIP = (ip?: string): string => {
    if (!ip) return '-';
    const clean = ip.trim();
    if (clean === '0:0:0:0:0:0:0:1' || clean === '::1') return '127.0.0.1 (Local)';
    return clean;
  };

  // Syntax Error ကို ရှင်းလင်းထားသော Function
  const humanizeDescription = (desc?: string, log?: AuditLogType): string => {
    if (!desc) return 'System activity recorded.';
    
    if (desc.includes('updateStaffStatus')) {
      const target = log?.userName ? ` for account "${log.userName}"` : '';
      let val = '';
      if (log?.newValue) {
        val = ` to ${log.newValue.replace(/"/g, '')}`;
      }
      return `Changed staff account status${val}${target}`;
    }
    if (desc.includes('createStaff')) {
      return log?.userName ? `Created new staff account for "${log.userName}"` : 'Created new staff/admin account';
    }
    if (desc.includes('updateStaff')) {
      return log?.userName ? `Updated staff account details for "${log.userName}"` : 'Updated staff account details';
    }
    if (desc.includes('deleteStaff')) {
      return log?.userName ? `Deactivated staff account for "${log.userName}"` : 'Deactivated staff account';
    }
    if (desc.includes('changePassword')) {
      return 'Changed account password';
    }

    if (desc.startsWith('Executed method: ')) {
      const m = desc.replace('Executed method: ', '').trim();
      const humanized = m.replace(/([A-Z])/g, ' $1').toLowerCase();
      return `Performed ${humanized} in ${log?.moduleName || 'system'}`;
    }

    return desc;
  };

  const getActionMeta = (action?: string) => {
    const act = action?.toUpperCase() || 'UNKNOWN';
    switch (act) {
      case 'LOGIN':
        return { 
          title: 'User Sign-In', 
          badgeClass: 'badge-login', 
          icon: <FiLogIn />, 
          isAuth: true 
        };
      case 'LOGOUT':
        return { 
          title: 'User Sign-Out', 
          badgeClass: 'badge-logout', 
          icon: <FiLogOut />, 
          isAuth: true 
        };
      case 'CREATE':
        return { 
          title: 'New Record Created', 
          badgeClass: 'badge-create', 
          icon: <FiPlusCircle />, 
          isAuth: false 
        };
      case 'UPDATE':
        return { 
          title: 'Record Updated', 
          badgeClass: 'badge-update', 
          icon: <FiEdit3 />, 
          isAuth: false 
        };
      case 'DELETE':
        return { 
          title: 'Record Deleted', 
          badgeClass: 'badge-delete', 
          icon: <FiTrash2 />, 
          isAuth: false 
        };
      default:
        return { 
          title: act, 
          badgeClass: 'badge-default', 
          icon: <FiActivity />, 
          isAuth: false 
        };
    }
  };

  // Helper to parse log timestamps safely
  const parseLogTime = (dateStr?: string): number | null => {
    if (!dateStr) return null;
    let d = new Date(dateStr);
    if (!isNaN(d.getTime())) return d.getTime();
    d = new Date(dateStr.replace(' ', 'T'));
    if (!isNaN(d.getTime())) return d.getTime();
    return null;
  };

  // Filter logs by date, action, and search query
  const filteredLogs = logs.filter((log) => {
    // 1. Date Filter (Quick Presets or Custom Start/End Date)
    if (startDate || endDate) {
      const logTime = parseLogTime(log.createdAt);
      if (logTime !== null) {
        if (startDate) {
          const [sY, sM, sD] = startDate.split('-').map(Number);
          const startBoundary = new Date(sY, sM - 1, sD, 0, 0, 0, 0).getTime();
          if (logTime < startBoundary) return false;
        }
        if (endDate) {
          const [eY, eM, eD] = endDate.split('-').map(Number);
          const endBoundary = new Date(eY, eM - 1, eD, 23, 59, 59, 999).getTime();
          if (logTime > endBoundary) return false;
        }
      }
    }
    if (selectedAction !== 'ALL' && log.action?.toUpperCase() !== selectedAction) {
      return false;
    }
    if (selectedModule !== 'ALL' && log.moduleName?.toUpperCase() !== selectedModule) {
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

        {/* Custom Date Form */}
        <form className="date-filter-form" onSubmit={handleApplyFilter}>
          <div className="date-input-group">
            <label>From Date</label>
            <input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)} 
            />
          </div>

          <div className="date-input-group">
            <label>To Date</label>
            <input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)} 
            />
          </div>

          <button type="submit" className="btn-filter-apply">
            Apply Date
          </button>

          <button type="button" className="btn-filter-reset" onClick={handleReset}>
            Reset All
          </button>
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
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            title="Filter by System Module"
          >
            <option value="ALL">All Modules</option>
            {availableModules.map((mod) => (
              <option key={mod} value={mod}>
                {mod}
              </option>
            ))}
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

      {/* Error Message */}
      {error && <div className="error-banner">Error: {error}</div>}

      {/* Stats Bar */}
      <div className="audit-stats-bar">
        <div>
          Showing <strong>{filteredLogs.length}</strong> of <strong>{logs.length}</strong> total events
        </div>
        {activePreset !== 'all' && (
          <span className="active-filter-badge">
            Date filter active ({startDate || '...'} to {endDate || '...'})
          </span>
        )}
      </div>

      {/* Table */}
      <div className="audit-table-wrapper">
        <table className="audit-table">
          <thead>
            <tr>
              <th>ID</th>
              <th style={{ width: '120px', minWidth: '120px', whiteSpace: 'nowrap' }}>Action</th>
              <th>Module</th>
              <th>Performed By</th>
              <th>IP Address</th>
              <th>Status</th>
              <th>Date & Time</th>
              <th style={{ textAlign: 'center' }}>Details</th>
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
                  {formatTableIP(log.ipAddress)}
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
      {selectedLog && (() => {
        const actionMeta = getActionMeta(selectedLog.action);
        const actionUpper = selectedLog.action?.toUpperCase();
        const isAuthAction = actionUpper === 'LOGIN' || actionUpper === 'LOGOUT';
        let oldParsed = tryParseJSON(selectedLog.oldValue);
        let newParsed = tryParseJSON(selectedLog.newValue);

        // Smart normalization: if newValue is a simple string (e.g. "INACTIVE" / "ACTIVE")
        if (oldParsed && typeof oldParsed === 'object' && (!newParsed || typeof newParsed !== 'object') && selectedLog.newValue) {
          const cleanNew = selectedLog.newValue.replace(/^"|"$/g, '').trim();
          if (oldParsed.status && (cleanNew === 'ACTIVE' || cleanNew === 'INACTIVE')) {
            newParsed = { ...oldParsed, status: cleanNew };
          } else {
            newParsed = { ...oldParsed, updatedValue: cleanNew };
          }
        }

        // If newParsed has only 1 field (like status), inherit unchanged fields from oldParsed so diff works cleanly
        if (oldParsed && newParsed && typeof oldParsed === 'object' && typeof newParsed === 'object') {
          const newKeys = Object.keys(newParsed);
          if (newKeys.length === 1 && !newParsed.email && oldParsed.email) {
            newParsed = { ...oldParsed, ...newParsed };
          }
        }
        const hasRawData = Boolean(selectedLog.oldValue || selectedLog.newValue);

        const renderChangeDetails = () => {
          // 1. Authentication / Session Activity (LOGIN / LOGOUT)
          if (isAuthAction) {
            return (
              <div className="audit-auth-card">
                <div className="audit-auth-icon-wrap">
                  {actionUpper === 'LOGIN' ? (
                    <FiLogIn size={26} color="#0284c7" />
                  ) : (
                    <FiLogOut size={26} color="#475569" />
                  )}
                </div>
                <div className="audit-auth-body">
                  <h4 className="audit-auth-title">
                    {actionUpper === 'LOGIN' ? 'User Login Session Event' : 'User Logout Session Event'}
                  </h4>
                  <p className="audit-auth-desc">
                    This entry records that account <strong>{selectedLog.userName || 'Account'}</strong>{' '}
                    {actionUpper === 'LOGIN' ? 'successfully signed into' : 'signed out of'} the backoffice system.
                  </p>
                  <div className="audit-auth-badge-notice">
                    <FiInfo size={16} style={{ flexShrink: 0, marginTop: '2px', color: '#0284c7' }} />
                    <span>
                      <strong>No Data Records Modified:</strong> Authentication logs verify credentials and maintain security auditing. No database records (such as products, orders, categories, or staff settings) were altered during this sign-in/out event.
                    </span>
                  </div>
                </div>
              </div>
            );
          }

          // 2. User toggled Raw JSON View
          if (showRawJson) {
            return (
              <div className="audit-diff-section">
                <div className="audit-diff-toolbar">
                  <div className="audit-diff-toolbar-title">
                    <FiCode size={15} style={{ marginRight: '6px' }} />
                    <strong>Raw JSON Data Snapshot</strong>
                  </div>
                  <button 
                    type="button" 
                    className="btn-diff-filter active"
                    onClick={() => setShowRawJson(false)}
                  >
                    Back to Formatted Table View
                  </button>
                </div>
                <div className="audit-raw-grid">
                  <div>
                    <div className="audit-raw-label audit-raw-old-label">Previous State (Old Value)</div>
                    <pre className="audit-raw-box">{formatJSON(selectedLog.oldValue)}</pre>
                  </div>
                  <div>
                    <div className="audit-raw-label audit-raw-new-label">Updated State (New Value)</div>
                    <pre className="audit-raw-box">{formatJSON(selectedLog.newValue)}</pre>
                  </div>
                </div>
              </div>
            );
          }

          // 3. Structured Data Comparison (UPDATE / CREATE / DELETE)
          if (oldParsed || newParsed) {
            // Case A: UPDATE (Both Old & New parsed)
            if (oldParsed && newParsed) {
              const allKeys = Array.from(new Set([...Object.keys(oldParsed), ...Object.keys(newParsed)]))
                .filter((k) => !isTechnicalKey(k));
              const rows = allKeys.map((key) => {
                const oldVal = oldParsed[key];
                const newVal = newParsed[key];
                const oldStr = formatFieldValue(oldVal, key);
                const newStr = formatFieldValue(newVal, key);
                const isChanged = oldStr !== newStr;
                return {
                  key,
                  label: humanizeFieldLabel(key),
                  oldStr,
                  newStr,
                  isChanged,
                };
              });

              const changedRows = rows.filter((r) => r.isChanged);
              const displayedRows = onlyChangedFields && changedRows.length > 0 ? changedRows : rows;

              return (
                <div className="audit-diff-section">
                  <div className="audit-diff-toolbar">
                    <div className="audit-diff-toolbar-title">
                      <strong>Data Changes Comparison</strong>
                      <span className="audit-diff-count-badge">
                        {changedRows.length} {changedRows.length === 1 ? 'field modified' : 'fields modified'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {changedRows.length > 0 && (
                        <button
                          type="button"
                          className={`btn-diff-filter ${onlyChangedFields ? 'active' : ''}`}
                          onClick={() => setOnlyChangedFields(!onlyChangedFields)}
                        >
                          <FiFilter size={13} style={{ marginRight: '4px' }} />
                          {onlyChangedFields ? `Show All Fields (${rows.length})` : `Show Changed Only (${changedRows.length})`}
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn-diff-filter"
                        onClick={() => setShowRawJson(true)}
                        title="View raw technical JSON"
                      >
                        <FiCode size={13} style={{ marginRight: '4px' }} />
                        View Raw JSON
                      </button>
                    </div>
                  </div>

                  <div className="audit-diff-table-container">
                    <table className="audit-diff-table">
                      <thead>
                        <tr>
                          <th style={{ width: '28%' }}>Field Name</th>
                          <th style={{ width: '33%' }}>Previous Value</th>
                          <th style={{ width: '5%', textAlign: 'center' }}></th>
                          <th style={{ width: '34%' }}>Updated Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayedRows.map((row) => (
                          <tr key={row.key} className={row.isChanged ? 'row-changed' : 'row-unchanged'}>
                            <td className="diff-field-name">
                              <span>{row.label}</span>
                              {row.isChanged && <span className="diff-tag-modified">Modified</span>}
                            </td>
                            <td className="diff-old-val">
                              <span className={row.isChanged ? 'val-highlight-old' : ''}>
                                {row.oldStr}
                              </span>
                            </td>
                            <td className="diff-arrow">
                              {row.isChanged ? '→' : '—'}
                            </td>
                            <td className="diff-new-val">
                              <span className={row.isChanged ? 'val-highlight-new' : ''}>
                                {row.newStr}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            }

            // Case B: CREATE (Only New parsed)
            if (!oldParsed && newParsed) {
              const keys = Object.keys(newParsed).filter((k) => !isTechnicalKey(k));
              return (
                <div className="audit-diff-section">
                  <div className="audit-diff-toolbar">
                    <div className="audit-diff-toolbar-title">
                      <strong>Newly Created Record Attributes</strong>
                      <span className="audit-diff-count-badge badge-green">{keys.length} fields initialized</span>
                    </div>
                    <button
                      type="button"
                      className="btn-diff-filter"
                      onClick={() => setShowRawJson(true)}
                    >
                      <FiCode size={13} style={{ marginRight: '4px' }} />
                      View Raw JSON
                    </button>
                  </div>

                  <div className="audit-diff-table-container">
                    <table className="audit-diff-table">
                      <thead>
                        <tr>
                          <th style={{ width: '35%' }}>Field Name</th>
                          <th style={{ width: '65%' }}>Initial Assigned Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {keys.map((key) => (
                          <tr key={key} className="row-created">
                            <td className="diff-field-name">{humanizeFieldLabel(key)}</td>
                            <td className="diff-new-val">
                              <span className="val-highlight-new">{formatFieldValue(newParsed[key], key)}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            }

            // Case C: DELETE (Only Old parsed)
            if (oldParsed && !newParsed) {
              const keys = Object.keys(oldParsed).filter((k) => !isTechnicalKey(k));
              return (
                <div className="audit-diff-section">
                  <div className="audit-diff-toolbar">
                    <div className="audit-diff-toolbar-title">
                      <strong>Deleted Record Snapshot</strong>
                      <span className="audit-diff-count-badge badge-red">{keys.length} fields removed</span>
                    </div>
                    <button
                      type="button"
                      className="btn-diff-filter"
                      onClick={() => setShowRawJson(true)}
                    >
                      <FiCode size={13} style={{ marginRight: '4px' }} />
                      View Raw JSON
                    </button>
                  </div>

                  <div className="audit-diff-table-container">
                    <table className="audit-diff-table">
                      <thead>
                        <tr>
                          <th style={{ width: '35%' }}>Field Name</th>
                          <th style={{ width: '65%' }}>Value Prior to Deletion</th>
                        </tr>
                      </thead>
                      <tbody>
                        {keys.map((key) => (
                          <tr key={key} className="row-deleted">
                            <td className="diff-field-name">{humanizeFieldLabel(key)}</td>
                            <td className="diff-old-val">
                              <span className="val-highlight-old">{formatFieldValue(oldParsed[key], key)}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            }
          }

          // 4. Plain text / Non-JSON data
          if (hasRawData) {
            return (
              <div className="audit-diff-section">
                <div className="audit-diff-toolbar">
                  <div className="audit-diff-toolbar-title">
                    <strong>Recorded Details</strong>
                  </div>
                </div>
                <div className="audit-raw-grid">
                  {selectedLog.oldValue && (
                    <div>
                      <div className="audit-raw-label audit-raw-old-label">Previous Value</div>
                      <div className="audit-text-box">{selectedLog.oldValue}</div>
                    </div>
                  )}
                  {selectedLog.newValue && (
                    <div>
                      <div className="audit-raw-label audit-raw-new-label">New Value</div>
                      <div className="audit-text-box">{selectedLog.newValue}</div>
                    </div>
                  )}
                </div>
              </div>
            );
          }

          // 5. No data at all
          return (
            <div className="audit-no-data-card">
              <FiInfo size={20} color="#6b7280" />
              <div>
                <strong>No Database Modifications</strong>
                <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: '#6b7280' }}>
                  This operation recorded system activity without modifying any database record attributes.
                </p>
              </div>
            </div>
          );
        };

        return (
          <div 
            className="audit-modal-overlay" 
            onClick={() => {
              setSelectedLog(null);
              setShowRawJson(false);
            }}
          >
            <div className="audit-modal-content" onClick={(e) => e.stopPropagation()}>
              {/* Modal Header */}
              <div className="audit-modal-header">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <h3 className="audit-modal-title">Audit Log Details #{selectedLog.id}</h3>
                    <span 
                      className={`action-badge ${actionMeta.badgeClass}`}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                    >
                      {actionMeta.icon}
                      <span>{actionMeta.title}</span>
                    </span>
                    <span className={`status-pill ${selectedLog.status === 'SUCCESS' ? 'status-pill-success' : 'status-pill-error'}`}>
                      {selectedLog.status === 'SUCCESS' ? <FiCheckCircle size={13} /> : <FiAlertCircle size={13} />}
                      <span>{selectedLog.status || 'SUCCESS'}</span>
                    </span>
                  </div>
                  <p className="audit-modal-subtitle">
                    Activity audit record and administrative trail
                  </p>
                </div>
                <button 
                  type="button"
                  className="audit-modal-close"
                  onClick={() => {
                    setSelectedLog(null);
                    setShowRawJson(false);
                  }}
                  title="Close modal"
                >
                  &times;
                </button>
              </div>

              {/* Meta Summary Cards */}
              <div className="audit-meta-grid">
                <div className="audit-meta-card">
                  <span className="meta-card-label">Performed By</span>
                  <div className="meta-card-val">
                    <FiUser className="meta-icon" />
                    <strong>{selectedLog.userName || 'SYSTEM'}</strong>
                    {selectedLog.userId ? <span className="meta-id-tag">ID: #{selectedLog.userId}</span> : null}
                  </div>
                </div>

                <div className="audit-meta-card">
                  <span className="meta-card-label">Date & Time</span>
                  <div className="meta-card-val">
                    <FiCalendar className="meta-icon" />
                    <span>{formatDateTimeDMY(selectedLog.createdAt)}</span>
                  </div>
                </div>

                <div className="audit-meta-card">
                  <span className="meta-card-label">System Module</span>
                  <div className="meta-card-val">
                    <FiLayers className="meta-icon" />
                    <span>{selectedLog.moduleName || 'General System'}</span>
                  </div>
                </div>

                <div className="audit-meta-card">
                  <span className="meta-card-label">Access Origin / IP</span>
                  <div className="meta-card-val">
                    <FiGlobe className="meta-icon" />
                    <span style={{ fontSize: '12.5px' }}>{formatIPAddress(selectedLog.ipAddress)}</span>
                  </div>
                </div>
              </div>

              {/* Event Description Box */}
              <div className="audit-desc-box">
                <FiInfo className="audit-desc-icon" />
                <div style={{ flex: 1 }}>
                  <div className="audit-desc-heading">Activity Description</div>
                  <div className="audit-desc-content">
                    {humanizeDescription(selectedLog.description, selectedLog)}
                  </div>
                </div>
              </div>

              {/* Changes or Session Content */}
              <div style={{ marginTop: '16px' }}>
                {renderChangeDetails()}
              </div>

              {/* Technical details hidden from UI per requirement */}
              {false && (
              <details className="audit-tech-accordion">
                <summary className="audit-tech-summary">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FiCode size={15} color="#4b5563" />
                    <span>Technical & Developer Details (API, Route, Database)</span>
                  </div>
                  <span className="audit-tech-hint">Click to inspect</span>
                </summary>
                <div className="audit-tech-body">
                  <div className="audit-tech-grid">
                    <div className="tech-item">
                      <span className="tech-label">HTTP Method</span>
                      <span className="tech-val"><code className="tech-code">{selectedLog.httpMethod || 'N/A'}</code></span>
                    </div>
                    <div className="tech-item">
                      <span className="tech-label">API Endpoint</span>
                      <span className="tech-val"><code className="tech-code">{selectedLog.endpoint || 'N/A'}</code></span>
                    </div>
                    <div className="tech-item">
                      <span className="tech-label">Database Table</span>
                      <span className="tech-val"><code className="tech-code">{selectedLog.tableName || 'N/A'}</code></span>
                    </div>
                    <div className="tech-item">
                      <span className="tech-label">Target Record ID</span>
                      <span className="tech-val"><code className="tech-code">{selectedLog.recordId ? `#${selectedLog.recordId}` : 'N/A'}</code></span>
                    </div>
                    <div className="tech-item tech-item-full">
                      <span className="tech-label">Client Browser (User-Agent)</span>
                      <div className="tech-code tech-ua">{selectedLog.userAgent || 'Not captured'}</div>
                    </div>
                  </div>
                </div>
              </details>
              )}

              {/* Modal Footer */}
              <div className="audit-modal-footer">
                <button 
                  type="button"
                  className="btn-modal-close"
                  onClick={() => {
                    setSelectedLog(null);
                    setShowRawJson(false);
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default AuditLog;