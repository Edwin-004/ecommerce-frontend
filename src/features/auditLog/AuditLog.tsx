import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../../store'; 
import { fetchAuditLogs } from './auditLogSlice';
import './AuditLog.css'; 

const AuditLog: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { logs, loading, error } = useSelector((state: RootState) => state.auditLog);

  // Custom Modal အတွက် State
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  useEffect(() => {
    dispatch(fetchAuditLogs());
  }, [dispatch]);

  // JSON string များကို လှပစွာစီစဉ်ပေးမည့် (Pretty Print) Function
  const formatJSON = (value: string | undefined | null) => {
    if (!value) return 'No data / Not applicable';
    try {
      const parsed = JSON.parse(value);
      return JSON.stringify(parsed, null, 2);
    } catch (e) {
      return value; // JSON မဟုတ်လျှင် နဂိုအတိုင်းပြန်ပြမည်
    }
  };

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
              <th>Performed By</th>
              <th>IP Address</th>
              <th>Status</th>
              <th>Date & Time</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td>{log.id}</td>
                <td>
                  <span className={`action-badge action-${log.action?.toLowerCase()}`} style={{ fontWeight: 'bold' }}>
                    {log.action}
                  </span>
                </td>
                <td>{log.moduleName}</td>
                <td style={{ fontWeight: '500' }}>{log.userName || 'SYSTEM'}</td>
                <td>{log.ipAddress || '-'}</td>
                <td>
                  <span className={`status-badge ${log.status === 'SUCCESS' ? 'status-success' : 'status-error'}`} style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '12px', background: log.status === 'SUCCESS' ? '#dcfce7' : '#fee2e2', color: log.status === 'SUCCESS' ? '#166534' : '#991b1b' }}>
                    {log.status || 'SUCCESS'}
                  </span>
                </td>
                <td>{new Date(log.createdAt).toLocaleString()}</td>
                <td>
                  <button 
                    onClick={() => setSelectedLog(log)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '13px'
                    }}
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {logs.length === 0 && <div className="message-text" style={{ textAlign: 'center', padding: '20px' }}>No audit logs found.</div>}
      </div>

      {/* Details ပြသရန် Custom Modal Box */}
      {selectedLog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            padding: '24px',
            borderRadius: '8px',
            width: '80%',
            maxWidth: '900px',
            maxHeight: '85vh',
            overflowY: 'auto',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e5e7eb', paddingBottom: '12px', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '20px', color: '#1f2937' }}>Audit Log Details</h3>
              <button 
                onClick={() => setSelectedLog(null)} 
                style={{ background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#6b7280' }}
              >
                ✖
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px', fontSize: '14px', color: '#374151' }}>
              <div><strong>Action:</strong> {selectedLog.action}</div>
              <div><strong>Module:</strong> {selectedLog.moduleName}</div>
              <div><strong>Performed By:</strong> {selectedLog.userName}</div>
              <div><strong>Date:</strong> {new Date(selectedLog.createdAt).toLocaleString()}</div>
              <div style={{ gridColumn: 'span 2' }}><strong>Description:</strong> {selectedLog.description || 'No description provided'}</div>
            </div>

            {/* Old Value & New Value နှိုင်းယှဉ်ချက် */}
            <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#dc2626' }}>Previous Data (Old Value)</h4>
                <pre style={{
                  backgroundColor: '#f9fafb',
                  padding: '12px',
                  borderRadius: '6px',
                  border: '1px solid #e5e7eb',
                  fontSize: '13px',
                  overflowX: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  maxHeight: '400px',
                  overflowY: 'auto'
                }}>
                  {formatJSON(selectedLog.oldValue)}
                </pre>
              </div>
              
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#16a34a' }}>Updated Data (New Value)</h4>
                <pre style={{
                  backgroundColor: '#f9fafb',
                  padding: '12px',
                  borderRadius: '6px',
                  border: '1px solid #e5e7eb',
                  fontSize: '13px',
                  overflowX: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  maxHeight: '400px',
                  overflowY: 'auto'
                }}>
                  {formatJSON(selectedLog.newValue)}
                </pre>
              </div>
            </div>

            <div style={{ textAlign: 'right', marginTop: '24px' }}>
              <button 
                onClick={() => setSelectedLog(null)}
                style={{
                  padding: '8px 24px',
                  backgroundColor: '#4b5563',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
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