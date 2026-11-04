import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../../store'; 
import { fetchAuditLogs } from './auditLogSlice';
import './AuditLog.css';
import { formatDateTime } from '../../utils/dateUtils'; // á€¡á€‘á€€á€ºá€á€½á€„á€ºá€›á€±á€¸á€á€²á€·á€žá€±á€¬ CSS á€€á€­á€¯ á€œá€¾á€™á€ºá€¸á€á€»á€­á€á€ºá€á€¼á€„á€ºá€¸

const AuditLog: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { logs, loading, error } = useSelector((state: RootState) => state.auditLog);

  useEffect(() => {
    dispatch(fetchAuditLogs());
  }, [dispatch]);

  if (loading) return <div className="message-text">Loading audit logs...</div>;
  if (error) return <div className="message-text error-text">Error: {error}</div>;

  return (
    <div className="audit-container">
      <div style={{ marginBottom: "20px" }}>
        <h1 className="text-xl font-semibold text-slate-900 tracking-tight">System Audit Logs</h1>
        <p className="text-xs text-slate-500">View chronological system activities, events, and security logs</p>
      </div>
      <div className="audit-table-wrapper">
        <table className="audit-table">
          <thead>
            <tr>
              <th>No.</th>
              <th>Action</th>
              <th>Module</th>
              <th>User</th>
              <th>IP Address</th>
              <th>Status</th>
              <th>Date & Time</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log, index) => (
              <tr key={log.id}>
                <td>{index + 1}</td>
                <td className="action-text">{log.action}</td>
                <td>{log.moduleName}</td>
                <td>{log.userName}</td>
                <td>{log.ipAddress}</td>
                <td>
                  <span className={`status-badge ${log.status === 'SUCCESS' ? 'status-success' : 'status-error'}`}>
                    {log.status}
                  </span>
                </td>
                <td>{formatDateTime(log.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {logs.length === 0 && <div className="message-text">No logs found.</div>}
      </div>
    </div>
  );
};

export default AuditLog;