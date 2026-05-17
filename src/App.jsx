import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import RouteLoader from './components/RouteLoader';
import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';
import ProtectedAdminRoute from './components/ProtectedAdminRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';

const SpecialistDashboard = lazy(() => import('./pages/SpecialistDashboard'));
const SpecialistCaseFile = lazy(() => import('./pages/SpecialistCaseFile'));
const SpecialistVerification = lazy(() => import('./pages/SpecialistVerification'));
const SupportCaseDesk = lazy(() => import('./pages/SupportCaseDesk'));
const SecurityScore = lazy(() => import('./pages/SecurityScore'));
const SecureSetup = lazy(() => import('./pages/SecureSetup'));
const Resources = lazy(() => import('./pages/Resources'));
const Community = lazy(() => import('./pages/Community'));
const CommunityPostDetail = lazy(() => import('./pages/CommunityPostDetail'));
const SourceProtection = lazy(() => import('./pages/SourceProtection'));
const RequestSupport = lazy(() => import('./pages/RequestSupport'));
const Settings = lazy(() => import('./pages/Settings'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AIAdvisor      = lazy(() => import('./pages/AIAdvisor'));
const CreatePost     = lazy(() => import('./pages/CreatePost'));
const ThreatModel    = lazy(() => import('./pages/ThreatModel'));
const Simulations    = lazy(() => import('./pages/Simulations'));
const MyCases        = lazy(() => import('./pages/MyCases'));
const Welcome        = lazy(() => import('./pages/Welcome'));

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
        <Route
          path="specialist-verification"
          element={
            <ProtectedRoute>
              {withRouteSuspense(<SpecialistVerification />)}
            </ProtectedRoute>
          }
        />
        <Route
          path="specialist-cases/:requestId"
          element={
            <ProtectedRoute>
              {withRouteSuspense(<SpecialistCaseFile />)}
            </ProtectedRoute>
          }
        />
        <Route
          path="support-cases/:requestId"
          element={
            <ProtectedRoute>
              {withRouteSuspense(<SupportCaseDesk />)}
            </ProtectedRoute>
          }
        />
        <Route
          path="my-cases"
          element={
            <ProtectedRoute>
              {withRouteSuspense(<MyCases />)}
            </ProtectedRoute>
          }
        />
        <Route path="crisis" element={<Navigate to="/" replace />} />
        <Route path="dashboard" element={<Navigate to="/" replace />} />
        <Route path="security-score" element={withRouteSuspense(<SecurityScore />)} />
        <Route path="secure-setup" element={withRouteSuspense(<SecureSetup />)} />
        <Route path="resources" element={withRouteSuspense(<Resources />)} />
        <Route path="community" element={withRouteSuspense(<Community />)} />
        <Route path="community/new" element={withRouteSuspense(<CreatePost />)} />
        <Route path="community/:postId" element={withRouteSuspense(<CommunityPostDetail />)} />
        <Route path="source-protection" element={withRouteSuspense(<SourceProtection />)} />
        <Route path="simulations" element={withRouteSuspense(<Simulations />)} />
        <Route path="request-support" element={withRouteSuspense(<RequestSupport />)} />
        <Route
          path="ai-advisor"
          element={
            <ProtectedRoute>
              {withRouteSuspense(<AIAdvisor />)}
            </ProtectedRoute>
          }
        />
        <Route
          path="threat-model"
          element={
            <ProtectedRoute>
              {withRouteSuspense(<ThreatModel />)}
            </ProtectedRoute>
          }
        />
        <Route path="login" element={<Login />} />
        <Route path="signup" element={<Signup />} />
        <Route
          path="welcome"
          element={
            <ProtectedRoute>
              {withRouteSuspense(<Welcome />)}
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  );
}

export default App;
