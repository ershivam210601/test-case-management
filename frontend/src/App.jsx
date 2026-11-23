import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ProjectProvider } from './context/ProjectContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';

const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const TestCasesPage = lazy(() => import('./pages/TestCasesPage'));
const TestCaseFormPage = lazy(() => import('./pages/TestCaseFormPage'));
const TestSuitesPage = lazy(() => import('./pages/TestSuitesPage'));
const TestSuiteDetailPage = lazy(() => import('./pages/TestSuiteDetailPage'));
const ProjectsPage = lazy(() => import('./pages/ProjectsPage'));
const DefectsPage = lazy(() => import('./pages/DefectsPage'));
const UserManagementPage = lazy(() => import('./pages/UserManagementPage'));

function Layout({ children }) {
  return (
    <ProjectProvider>
      <div className="app-shell">
        <Sidebar />
        <div className="app-body">
          <TopBar />
          <main className="main-content">{children}</main>
        </div>
      </div>
    </ProjectProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <BrowserRouter>
          <Suspense fallback={<div className="loading">Loading...</div>}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/dashboard" element={<ProtectedRoute><Layout><DashboardPage /></Layout></ProtectedRoute>} />
              <Route path="/test-cases" element={<ProtectedRoute><Layout><TestCasesPage /></Layout></ProtectedRoute>} />
              <Route path="/test-cases/new" element={<ProtectedRoute roles={['admin', 'test_lead']}><Layout><TestCaseFormPage /></Layout></ProtectedRoute>} />
              <Route path="/test-cases/:id/edit" element={<ProtectedRoute roles={['admin', 'test_lead']}><Layout><TestCaseFormPage /></Layout></ProtectedRoute>} />
              <Route path="/test-suites" element={<ProtectedRoute><Layout><TestSuitesPage /></Layout></ProtectedRoute>} />
              <Route path="/test-suites/:id" element={<ProtectedRoute><Layout><TestSuiteDetailPage /></Layout></ProtectedRoute>} />
              <Route path="/defects" element={<ProtectedRoute><Layout><DefectsPage /></Layout></ProtectedRoute>} />
              <Route path="/reports" element={<ProtectedRoute><Layout><DashboardPage /></Layout></ProtectedRoute>} />
              <Route path="/projects" element={<ProtectedRoute roles={['admin', 'test_lead']}><Layout><ProjectsPage /></Layout></ProtectedRoute>} />
              <Route path="/user-management" element={<ProtectedRoute roles={['admin']}><Layout><UserManagementPage /></Layout></ProtectedRoute>} />
              <Route path="*" element={<ProtectedRoute><Layout><DashboardPage /></Layout></ProtectedRoute>} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  );
}
