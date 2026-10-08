// src/App.tsx
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
import { AllOrders } from './features/orders/AllOrders';
import CategoryManagement from './features/categories/CategoryManagement';
import { BrandsPage } from './features/brand/BrandsPage';
import TagManagement from "./features/tags/TagManagement";
import StaffList from './components/StaffList';
import { Profile } from './components/Profile';
import { ReportsPage } from './features/reports/ReportsPage';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* ADMIN ရော STAFF ပါ ဝင်ခွင့်ပြုမည့် လမ်းကြောင်းများ */}
        <Route
          element={
            <ProtectedRoute
              allowedRoles={['ADMIN', 'INVENTORY_STAFF', 'SALES_STAFF']}
            />
          }
        >
          <Route element={<AdminLayout />}>
            {/* Dashboard & Profile */}
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/profile" element={<Profile />} />

            {/* Product Catalog & Stock (Member 3) */}
            <Route path="/admin/products" element={<ProductManagementPage />} />
            <Route path="/admin/products/new" element={<CreateProductPage />} />
            <Route path="/admin/variants" element={<VariantsPage />} />
            <Route path="/admin/variations" element={<VariantsPage />} />
            <Route path="/admin/inventory" element={<InventoryPage />} />

            {/* Categories */}
            <Route path="/admin/categories" element={<CategoryManagement />} />

            <Route path="/admin/brands" element={<BrandsPage />}
/>
            {/* Tags */} 
            <Route path="/admin/tags" element={<TagManagement />} />

            {/* Staff Management */}
            <Route path="/admin/staff" element={<StaffList />} />

            {/* Reports */}
            <Route path="/admin/reports" element={<ReportsPage />} />

            {/* Orders Management */}
            <Route path="/admin/orders" element={<AllOrders />} />

            {/* တိုက်ရိုက် /admin ဟု ခေါ်ပါက dashboard သို့ လွှဲပေးမည် */}
            <Route
              path="/admin"
              element={<Navigate to="/admin/dashboard" replace />}
            />
          </Route>
        </Route>

        {/* မရှိသော URL ရိုက်ထည့်မိပါက Login သို့ အလိုအလျောက် ပြန်ပို့မည် */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
