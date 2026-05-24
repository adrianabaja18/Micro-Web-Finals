import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarDays,
  KeyRound,
  ClipboardList,
  Bell,
  LogOut,
  Cpu,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/logo.png";
import logov2 from "../assets/logov2.png";

const links = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/bookings", label: "Bookings", icon: CalendarDays },
  { to: "/keys", label: "Keys", icon: KeyRound },
  { to: "/logs", label: "Logs", icon: ClipboardList },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/device-control", label: "Device Control", icon: Cpu },
];

export default function Layout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed left-0 top-0 h-screen w-64 bg-slate-950 text-white p-5 hidden md:flex flex-col">
        <div className="mb-8 flex items-center gap-3">
          <img
            src={logov2}
            alt="Key Dispenser Logo"
            className="h-10 w-10 rounded-xl object-cover"
          />
          <div>
            <h1 className="text-xl font-bold">Key Dispenser</h1>
            <p className="text-sm text-slate-400">Host Control Panel</p>
          </div>
        </div>

        <nav className="space-y-2 flex-1">
          {links.map((link) => {
            const Icon = link.icon;

            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                    isActive
                      ? "bg-white text-slate-950"
                      : "text-slate-300 hover:bg-slate-800"
                  }`
                }
              >
                <Icon size={18} />
                {link.label}
              </NavLink>
            );
          })}
        </nav>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500 hover:bg-red-600 transition"
        >
          <LogOut size={18} />
          Logout
        </button>
      </aside>

      <main className="md:ml-64 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
