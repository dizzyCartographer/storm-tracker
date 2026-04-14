import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router";
import { AuthProvider, useAuth } from "./lib/auth-context";
import SignIn from "./pages/SignIn";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Log from "./pages/Log";
import LogDetail from "./pages/LogDetail";
import History from "./pages/History";
import Reports from "./pages/Reports";

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
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
