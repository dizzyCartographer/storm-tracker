import { Link, useLocation } from "react-router";
import { useAuth } from "../lib/auth-context";
import { Logo } from "./Logo";

const links = [
  { path: "/dashboard", label: "Dashboard" },
  { path: "/log", label: "+ Log" },
  { path: "/history", label: "History" },
  { path: "/reports", label: "Reports" },
  { path: "/journal-import", label: "AI Import" },
  { path: "/projects", label: "Projects" },
];

export default function Nav() {
  const { signOut } = useAuth();
  const location = useLocation();

  return (
    <nav className="bg-white border-b border-[#D1E8E4] px-4 py-3">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/dashboard" className="flex items-center gap-2 text-lg font-bold text-[#0D9488]">
            <Logo color="#0D9488" size={24} />
            Storm Tracker
          </Link>
          <div className="hidden sm:flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === link.path
                    ? "bg-[#CCFBF1] text-[#0D9488]"
                    : "text-[#475569] hover:text-[#0F172A] hover:bg-[#F0FDFA]"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/profile"
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              location.pathname === "/profile"
                ? "bg-[#CCFBF1] text-[#0D9488]"
                : "text-[#475569] hover:text-[#0F172A] hover:bg-[#F0FDFA]"
            }`}
          >
            Profile
          </Link>
          <button
            onClick={signOut}
            className="text-sm text-[#475569] hover:text-[#0F172A] border border-[#D1E8E4] rounded-lg px-3 py-1.5"
          >
            Sign Out
          </button>
        </div>
      </div>
    </nav>
  );
}
