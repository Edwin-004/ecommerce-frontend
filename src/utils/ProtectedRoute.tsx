import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { type RootState } from '../store';

export const ProtectedRoute = ({ allowedRoles }: { allowedRoles: string[] }) => {
  const { token, role, mustChangePassword } = useSelector((state: RootState) => state.auth);
  const location = useLocation();

  if (!token) return <Navigate to="/login" replace />;

  // 1. If user must change password on first login, force them to stay on /admin/force-change-password
  if (mustChangePassword && location.pathname !== '/admin/force-change-password') {
    return <Navigate to="/admin/force-change-password" replace />;
  }

  // 2. If user does NOT need to change password, prevent accessing the force-change page
  if (!mustChangePassword && location.pathname === '/admin/force-change-password') {
    return <Navigate to="/admin/dashboard" replace />;
  }
  
  // 3. Role authorization check
  if (role && !allowedRoles.includes(role)) {
      console.warn("ဝင်ခွင့်မရှိပါ! Role မကိုက်ညီပါ။ Role:", role, "Allowed:", allowedRoles);
      return <Navigate to="/admin/dashboard" replace />;
  }

  return <Outlet />;
};
