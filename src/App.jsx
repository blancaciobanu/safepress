import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import RouteLoader from './components/RouteLoader';
import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';
import ProtectedAdminRoute from './components/ProtectedAdminRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const SpecialistDashboard = lazy(() => import('./pages/SpecialistDashboard'));
const SecurityScore = lazy(() => import('./pages/SecurityScore'));
const SecureSetup = lazy(() => import('./pages/SecureSetup'));
const Resources = lazy(() => import('./pages/Resources'));
const Community = lazy(() => import('./pages/Community'));
const CommunityPostDetail = lazy(() => import('./pages/CommunityPostDetail'));
const SourceProtection = lazy(() => import('./pages/SourceProtection'));
const RequestSupport = lazy(() => import('./pages/RequestSupport'));
const Settings = lazy(() => import('./pages/Settings'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

function withRouteSuspense(element) {
  return (
    <Suspense fallback={<RouteLoader />}>
      {element}
    </Suspense>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route
          path="dashboard"
          element={
            <ProtectedRoute>
              {withRouteSuspense(<Dashboard />)}
            </ProtectedRoute>
          }
        />
        <Route
          path="settings"
          element={
            <ProtectedRoute>
              {withRouteSuspense(<Settings />)}
            </ProtectedRoute>
          }
        />
        <Route
          path="admin"
          element={
            <ProtectedAdminRoute>
              {withRouteSuspense(<AdminDashboard />)}
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="specialist-dashboard"
          element={
            <ProtectedRoute>
              {withRouteSuspense(<SpecialistDashboard />)}
            </ProtectedRoute>
          }
        />
        <Route path="crisis" element={<Navigate to="/dashboard" replace />} />
        <Route path="security-score" element={withRouteSuspense(<SecurityScore />)} />
        <Route path="secure-setup" element={withRouteSuspense(<SecureSetup />)} />
        <Route path="resources" element={withRouteSuspense(<Resources />)} />
        <Route path="community" element={withRouteSuspense(<Community />)} />
        <Route path="community/:postId" element={withRouteSuspense(<CommunityPostDetail />)} />
        <Route path="source-protection" element={withRouteSuspense(<SourceProtection />)} />
        <Route path="request-support" element={withRouteSuspense(<RequestSupport />)} />
        <Route path="login" element={<Login />} />
        <Route path="signup" element={<Signup />} />
      </Route>
    </Routes>
  );
}

export default App;
