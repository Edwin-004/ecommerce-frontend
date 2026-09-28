// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './features/auth/Login';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminLayout } from './components/AdminLayout';
import { ProductManagementPage } from './features/products/ProductManagementPage';
import { CreateProductPage } from './features/products/CreateProductPage';
import { InventoryPage } from './features/inventory/InventoryPage';
import { VariantsPage } from './features/variants/VariantsPage';
import { ProtectedRoute } from './utils/ProtectedRoute';
<<<<<<< Updated upstream
import './App.css';
import { AllOrders } from './features/orders/AllOrders';
import OrderManagement from './features/orders/OrderManagement';
=======
import StaffList from './components/StaffList'; 
import { Profile } from './components/Profile'; 
import "./App.css";
>>>>>>> Stashed changes

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
<<<<<<< Updated upstream

        {/* ADMIN Role ရှိမှသာ ဝင်ခွင့်ပြုမည့် လမ်းကြောင်းများ */}
        <Route element={<ProtectedRoute allowedRole="ADMIN" />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/orders" element={<AllOrders />} />
            <Route path="/admin/orderdetails" element={<OrderManagement />} />
            {/* တိုက်ရိုက် /admin ဟု ခေါ်ပါက dashboard သို့ လွှဲပေးမည် */}
            <Route
              path="/admin"
              element={<Navigate to="/admin/dashboard" replace />}
            />
          </Route>
        </Route>

        {/* မရှိသော URL ရိုက်ထည့်မိပါက Login သို့ အလိုအလျောက် ပြန်ပို့မည် */}
=======
        
        {/* ADMIN ရော STAFF ပါ ဝင်ခွင့်ပြုမည့် လမ်းကြောင်းများ */}
        <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'INVENTORY_STAFF', 'SALES_STAFF']} />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/staff" element={<StaffList />} /> 
            <Route path="/admin/profile" element={<Profile />} /> 
            
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          </Route>
        </Route>
        
>>>>>>> Stashed changes
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
