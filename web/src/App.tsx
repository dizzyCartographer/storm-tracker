import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router";
import { AuthProvider, useAuth } from "./lib/auth-context";
import SignIn from "./pages/SignIn";
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
        <Routes>
          <Route path="/sign-in" element={<SignIn />} />
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
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
