import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { type RootState } from '../store';

export const ProtectedRoute = ({ allowedRoles }: { allowedRoles: string[] }) => {
  const { token, role } = useSelector((state: RootState) => state.auth);

  // ဘာ Role ရောက်လာလဲဆိုတာကို Browser Console မှာ ထုတ်ကြည့်ရန်
  console.log("Token ရှိ/မရှိ:", token ? "ရှိသည်" : "မရှိပါ");
  console.log("Redux ထဲရောက်နေသော Role:", role); 
  console.log("ဝင်ခွင့်ပြုထားသော Role များ:", allowedRoles);

  if (!token) return <Navigate to="/login" replace />;
  
  if (role && !allowedRoles.includes(role)) {
      console.log("ဝင်ခွင့်မရှိပါ! Role မကိုက်ညီပါ။");
      return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};