import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export const AdminLayout = () => {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{ flexGrow: 1, padding: '30px', background: '#f4f4f9' }}>
        <Outlet />
      </div>
    </div>
  );
};