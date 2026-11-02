import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../../store'; 
import { fetchAuditLogs } from './auditLogSlice';
import './AuditLog.css'; // အထက်တွင်ရေးခဲ့သော CSS ကို လှမ်းချိတ်ခြင်း

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
      <h2 className="audit-title">System Audit Logs</h2>
      <div className="audit-table-wrapper">
        <table className="audit-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Action</th>
              <th>Module</th>
              <th>User</th>
              <th>IP Address</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td>{log.id}</td>
                <td className="action-text">{log.action}</td>
                <td>{log.moduleName}</td>
                <td>{log.userName}</td>
                <td>{log.ipAddress}</td>
                <td>
                  <span className={`status-badge ${log.status === 'SUCCESS' ? 'status-success' : 'status-error'}`}>
                    {log.status}
                  </span>
                </td>
                <td>{new Date(log.createdAt).toLocaleString()}</td>
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