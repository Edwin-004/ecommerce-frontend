import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export const AdminLayout = () => {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', overflow: 'hidden' }}>
      <Sidebar />
      <div
        style={{
          flexGrow: 1,
          background: '#f4f4f9',
          overflowY: 'auto',
        }}
      >
        <Outlet />
      </div>
    </div>
  );
};
