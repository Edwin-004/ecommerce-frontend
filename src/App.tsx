// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './features/auth/Login';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminLayout } from './components/AdminLayout';
import { ProductManagementPage } from './features/products/ProductManagementPage';
import { CreateProductPage } from './features/products/CreateProductPage';
import { EditProductPage } from './features/products/EditProductPage';
import { InventoryPage } from './features/inventory/InventoryPage';

import { VariantsPage } from './features/variants/VariantsPage';
import { ProtectedRoute } from './utils/ProtectedRoute';
import { AllOrders } from './features/orders/AllOrders';
import CategoryManagement from './features/categories/CategoryManagement';

// --- Conflict ရှင်းလင်းပြီးသား Imports များ ---
import { BrandsPage } from './features/brand/BrandsPage';
import TagManagement from './features/tags/TagManagement';
import { StaffList } from './features/staff/StaffList';
import { CreateStaff } from './features/staff/CreateStaff';
// ---------------------------------------------

import { Profile } from './components/Profile';
import { ReportsPage } from './features/reports/ReportsPage';
import { RefundManagementPage } from './features/refunds/RefundManagementPage';
import './App.css';
import { ShippingRates } from './features/shipping/ShippingRates';
import AuditLog from './features/auditLog/AuditLog'; // <--- သင့်ဘက်မှ AuditLog Import
import { ToastContainer } from 'react-toastify'; // <--- main ဘက်မှ ToastContainer Import

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Back-office authenticated users check */}
        <Route
          element={
            <ProtectedRoute
              allowedRoles={['ADMIN', 'INVENTORY_STAFF', 'SALES_STAFF', 'ORDER_STAFF']}
            />
          }
        >
          <Route element={<AdminLayout />}>
            {/* Common Routes: Dashboard & Profile */}
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/profile" element={<Profile />} />

            {/* Product Catalog & Stock (ADMIN & INVENTORY_STAFF) */}
            <Route
              element={
                <ProtectedRoute
                  allowedRoles={['ADMIN', 'INVENTORY_STAFF']}
                />
              }
            >
              <Route path="/admin/products" element={<ProductManagementPage />} />
              <Route path="/productlist" element={<ProductManagementPage />} />
              <Route path="/admin/products/new" element={<CreateProductPage />} />
              <Route
                path="/admin/products/edit/:id"
                element={<EditProductPage />}
              />
              <Route path="/product" element={<CreateProductPage />} />
              <Route path="/admin/variants" element={<VariantsPage />} />
              <Route path="/admin/variations" element={<VariantsPage />} />
              <Route path="/admin/inventory" element={<InventoryPage />} />
              <Route path="/admin/categories" element={<CategoryManagement />} />
              <Route path="/admin/brands" element={<BrandsPage />} />
              <Route path="/admin/tags" element={<TagManagement />} />
            </Route>

            {/* Operations: Orders, Refunds, Shipping (ADMIN & SALES_STAFF / ORDER_STAFF) */}
            <Route
              element={
                <ProtectedRoute
                  allowedRoles={['ADMIN', 'SALES_STAFF', 'ORDER_STAFF']}
                />
              }
            >
              <Route path="/admin/orders" element={<AllOrders />} />
              <Route path="/admin/refunds" element={<RefundManagementPage />} />
              <Route path="/admin/shipping-rates" element={<ShippingRates />} />
            </Route>

            {/* Admin-only Routes: Staff Management, Reports & Audit Logs */}
            <Route
              element={
                <ProtectedRoute
                  allowedRoles={['ADMIN']}
                />
              }
            >
              <Route path="/admin/staff" element={<StaffList />} />
              <Route path="/admin/staff/new" element={<CreateStaff />} />
              <Route path="/admin/reports" element={<ReportsPage />} />
              <Route path="/admin/audit-logs" element={<AuditLog />} /> {/* <--- AuditLog ကို Admin အောက်တွင် ထည့်ထားသည် */}
            </Route>

            {/* Direct /admin redirects to dashboard */}
            <Route
              path="/admin"
              element={<Navigate to="/admin/dashboard" replace />}
            />
          </Route>
        </Route>

        {/* Fallback to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      <ToastContainer
        position="top-right"
        autoClose={4000}
        hideProgressBar={false}
      />
    </BrowserRouter>
  );
}

export default App;