import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { type RootState } from '../store';

export const ProtectedRoute = ({ allowedRole }: { allowedRole: string }) => {
  const { token, role } = useSelector((state: RootState) => state.auth);

  if (!token) return <Navigate to="/login" replace />;
  if (role !== allowedRole) return <Navigate to="/unauthorized" replace />;

  return <Outlet />;
};