import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { type RootState } from '../store';

export const ProtectedRoute = ({ allowedRoles }: { allowedRoles: string[] }) => {
  const { token, role } = useSelector((state: RootState) => state.auth);

  if (!token) return <Navigate to="/login" replace />;
  
  if (role && !allowedRoles.includes(role)) {
      console.warn("ဝင်ခွင့်မရှိပါ! Role မကိုက်ညီပါ။ Role:", role, "Allowed:", allowedRoles);
      return <Navigate to="/admin/dashboard" replace />;
  }

  return <Outlet />;
};
