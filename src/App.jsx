import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import SpecialistDashboard from './pages/SpecialistDashboard';
import SecurityScore from './pages/SecurityScore';
import SecureSetup from './pages/SecureSetup';
import Resources from './pages/Resources';
import Community from './pages/Community';
import RequestSupport from './pages/RequestSupport';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Settings from './pages/Settings';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import ProtectedAdminRoute from './components/ProtectedAdminRoute';

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route
          path="dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin"
          element={
            <ProtectedAdminRoute>
              <AdminDashboard />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="specialist-dashboard"
          element={
            <ProtectedRoute>
              <SpecialistDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="crisis" element={<Navigate to="/dashboard" replace />} />
        <Route path="security-score" element={<SecurityScore />} />
        <Route path="secure-setup" element={<SecureSetup />} />
        <Route path="resources" element={<Resources />} />
        <Route path="community" element={<Community />} />
        <Route path="request-support" element={<RequestSupport />} />
        <Route path="login" element={<Login />} />
        <Route path="signup" element={<Signup />} />
      </Route>
    </Routes>
  );
}

export default App;
