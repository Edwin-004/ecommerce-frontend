import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './features/auth/Login';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminLayout } from './components/AdminLayout';
import { ProtectedRoute } from './utils/ProtectedRoute';
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* လော့ဂ်အင် ဝင်ရန် စာမျက်နှာ */}
        <Route path="/login" element={<Login />} />
        
        {/* ADMIN Role ရှိမှသာ ဝင်ခွင့်ပြုမည့် လမ်းကြောင်းများ */}
        <Route element={<ProtectedRoute allowedRole="ADMIN" />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            
            {/* တိုက်ရိုက် /admin ဟု ခေါ်ပါက dashboard သို့ လွှဲပေးမည် */}
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          </Route>
        </Route>
        
        {/* မရှိသော URL ရိုက်ထည့်မိပါက Login သို့ အလိုအလျောက် ပြန်ပို့မည် */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;