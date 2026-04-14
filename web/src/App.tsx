import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router";
import { AuthProvider, useAuth } from "./lib/auth-context";
import SignIn from "./pages/SignIn";

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

function Dashboard() {
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen bg-[#EDF5F4] p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-[#0F172A]">
            Storm Tracker v2
          </h1>
          <button
            onClick={signOut}
            className="text-sm text-[#475569] hover:text-[#0F172A] border border-[#D1E8E4] rounded-lg px-3 py-1.5"
          >
            Sign Out
          </button>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-[#475569]">
            Dashboard placeholder — data layer works. Phase 2 will build this
            out.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/sign-in" element={<SignIn />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
