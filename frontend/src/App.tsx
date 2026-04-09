import { Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import { AuthProvider } from './auth/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

import { AccessDeniedPage } from './pages/AccessDeniedPage';
import { AdminBookingsPage } from './pages/AdminBookingsPage';
import { AdminTicketsPage } from './pages/AdminTicketsPage';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { AuthCallbackPage } from './pages/AuthCallbackPage';
import { HomeRedirectPage } from './pages/HomeRedirectPage';
import { LoginPage } from './pages/LoginPage';
import { StudentDashboardPage } from './pages/StudentDashboardPage';
import { StudentBookingsPage } from './pages/StudentBookingsPage';
import { UserHomePage } from './pages/UserHomePage';

import ResourcePage from "./pages/ResourcePage";
import ResourcesCatalogPage from './pages/ResourcesCatalogPage';
import ResourceListOnlyPage from './pages/ResourceListOnlyPage';
import EditResourcePage from './pages/EditResource'; 

function AppRoutes() {
  return (
    <Routes>
      {/* 🔐 Auth */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />

      {/* 🏠 App Home */}
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <UserHomePage />
          </ProtectedRoute>
        }
      />

      {/* 🎓 Student */}
      <Route
        path="/student/dashboard"
        element={
          <ProtectedRoute allowedRoles={['USER', 'TECHNICIAN']}>
            <StudentDashboardPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/student/bookings"
        element={
          <ProtectedRoute allowedRoles={['USER', 'TECHNICIAN']}>
            <StudentBookingsPage />
          </ProtectedRoute>
        }
      />

      {/* 🚫 Access */}
      <Route
        path="/access-denied"
        element={
          <ProtectedRoute>
            <AccessDeniedPage />
          </ProtectedRoute>
        }
      />

      {/* 🛠 Admin */}
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminUsersPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/bookings"
        element={
          <ProtectedRoute allowedRoles={['ADMIN', 'USER', 'TECHNICIAN']}>
            <AdminBookingsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/tickets"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminTicketsPage />
          </ProtectedRoute>
        }
      />

      {/* 📦 Resources */}
      <Route
        path="/resources"
        element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <ResourcePage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/resources/catalog"
        element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <ResourcesCatalogPage />
          </ProtectedRoute>
        }
      />

      {/* ✅ 🔥 EDIT RESOURCE PAGE (THIS WAS MISSING) */}
      <Route
        path="/resources/edit/:id"
        element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <EditResourcePage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/resources/list"
        element={
          <ProtectedRoute>
            <ResourceListOnlyPage />
          </ProtectedRoute>
        }
      />

      {/* 🔁 Default */}
      <Route path="/" element={<HomeRedirectPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;