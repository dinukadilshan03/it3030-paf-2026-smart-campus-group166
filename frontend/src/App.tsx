import { Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import { AuthProvider } from './auth/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AccessDeniedPage } from './pages/AccessDeniedPage';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { AuthCallbackPage } from './pages/AuthCallbackPage';
import { HomeRedirectPage } from './pages/HomeRedirectPage';
import { LoginPage } from './pages/LoginPage';
import { UserHomePage } from './pages/UserHomePage';
import ResourcePage from "./pages/ResourcePage";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />

      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <UserHomePage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/access-denied"
        element={
          <ProtectedRoute>
            <AccessDeniedPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/users"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminUsersPage />
          </ProtectedRoute>
        }
      />

      
      <Route
        path="/resources"
        element={
          <ProtectedRoute>
            <ResourcePage />
          </ProtectedRoute>
        }
      />

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
