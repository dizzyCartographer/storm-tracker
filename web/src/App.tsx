import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router";
import { AuthProvider, useAuth } from "./lib/auth-context";
import { ErrorBoundary } from "./components/ErrorBoundary";
import SignIn from "./pages/SignIn";
import Landing from "./pages/Landing";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Log from "./pages/Log";
import LogDetail from "./pages/LogDetail";
import History from "./pages/History";
import Reports from "./pages/Reports";
import Projects from "./pages/Projects";
import ProjectCreate from "./pages/ProjectCreate";
import ProjectDetail from "./pages/ProjectDetail";
import Profile from "./pages/Profile";
import JournalImport from "./pages/JournalImport";
import Reference from "./pages/Reference";
import Invite from "./pages/Invite";
import NotFound from "./pages/NotFound";

function ProtectedRoute() {
  const { isLoading, isSignedIn } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#EDF5F4] flex items-center justify-center">
        <p className="text-[#475569]">Loading...</p>
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/sign-in" replace />;
  }

  return <Outlet />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ErrorBoundary>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/sign-in" element={<SignIn />} />
            <Route path="/invite/:token" element={<Invite />} />

            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/log" element={<Log />} />
                <Route path="/log/:id" element={<LogDetail />} />
                <Route path="/history" element={<History />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/projects/create" element={<ProjectCreate />} />
                <Route path="/projects/:id" element={<ProjectDetail />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/journal-import" element={<JournalImport />} />
                <Route path="/reference" element={<Reference />} />
              </Route>
            </Route>

            {/* Redirects */}
            <Route path="/settings" element={<Navigate to="/projects" replace />} />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ErrorBoundary>
      </AuthProvider>
    </BrowserRouter>
  );
}
