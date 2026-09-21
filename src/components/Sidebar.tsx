import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logout } from '../features/auth/authSlice';

export const Sidebar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <div style={{ width: '250px', background: '#333', color: '#fff', minHeight: '100vh', padding: '20px', display: 'flex', flexDirection: 'column' }}>
      <h2>Admin Panel</h2>
      <nav style={{ flexGrow: 1, marginTop: '30px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <NavLink to="/admin/dashboard" style={{ color: '#fff', textDecoration: 'none' }}>Dashboard</NavLink>
        {/* နောက်ပိုင်း Menu အသစ်များ ဤနေရာတွင် ထပ်တိုးပါ */}
      </nav>
      <button onClick={handleLogout} style={{ background: '#f44336', color: 'white', padding: '10px', border: 'none', cursor: 'pointer' }}>
        Logout
      </button>
    </div>
  );
};