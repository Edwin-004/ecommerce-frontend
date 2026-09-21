import { useSelector } from 'react-redux';
import { type RootState } from '../store';

export const AdminDashboard = () => {
  const user = useSelector((state: RootState) => state.auth.username);

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome back, <strong>{user}</strong>!</p>
    </div>
  );
};