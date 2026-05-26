import { useEffect, useState } from "react";
import { Bell, CalendarDays, KeyRound, Server } from "lucide-react";
import StatCard from "../components/StatCard";
import {
  createDeviceIfMissing,
  listenBookings,
  listenDevice,
  listenKeys,
  listenLogs,
  listenNotifications,
} from "../firebase/services";

export default function Dashboard() {
  const [device, setDevice] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [keys, setKeys] = useState([]);
  const [logs, setLogs] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    createDeviceIfMissing();

    const unsubDevice = listenDevice(setDevice);
    const unsubBookings = listenBookings(setBookings);
    const unsubKeys = listenKeys(setKeys);
    const unsubLogs = listenLogs(setLogs, 25);
    const unsubNotifications = listenNotifications(setNotifications);

    return () => {
      unsubDevice();
      unsubBookings();
      unsubKeys();
      unsubLogs();
      unsubNotifications();
    };
  }, []);

  const activeBookings = bookings.filter((b) => b.status === "active").length;
  const availableKeys = keys.filter((k) => k.status === "available").length;
  const unreadNotifications = notifications.filter((n) => !n.read).length;

  return (
    <div className="h-[calc(100vh-2rem)] md:h-[calc(100vh-4rem)] overflow-hidden flex flex-col">
      <div className="mb-6 shrink-0">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-slate-500">
          Real-time monitoring for the automated key dispenser.
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-4 shrink-0">
        <StatCard
          title="Device Status"
          value={device?.status || "offline"}
          subtitle={device?.lcdMessage || "No LCD message"}
          icon={Server}
        />
        <StatCard
          title="Active Bookings"
          value={activeBookings}
          subtitle="Current valid access records"
          icon={CalendarDays}
        />
        <StatCard
          title="Available Keys"
          value={availableKeys}
          subtitle="Keys ready to dispense"
          icon={KeyRound}
        />
        <StatCard
          title="Unread Alerts"
          value={unreadNotifications}
          subtitle="Host notifications"
          icon={Bell}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mt-6 flex-1 min-h-0">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col min-h-0">
          <div className="mb-4 shrink-0">
            <h2 className="text-lg font-bold">Recent Logs</h2>
          </div>

          <div className="space-y-3 overflow-y-auto pr-2 flex-1 min-h-0">
            {logs.length === 0 && (
              <p className="text-sm text-slate-500">No logs yet.</p>
            )}

            {logs.map((log) => (
              <div key={log.id} className="border-b border-slate-100 pb-3">
                <p className="font-medium">{log.eventType}</p>
                <p className="text-sm text-slate-500">{log.message}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col min-h-0">
          <div className="mb-4 shrink-0">
            <h2 className="text-lg font-bold">Latest Notifications</h2>
          </div>

          <div className="space-y-3 overflow-y-auto pr-2 flex-1 min-h-0">
            {notifications.length === 0 && (
              <p className="text-sm text-slate-500">No notifications yet.</p>
            )}

            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-3 rounded-xl ${
                  notif.read ? "bg-slate-50" : "bg-blue-50"
                }`}
              >
                <p className="font-medium">{notif.title}</p>
                <p className="text-sm text-slate-500">{notif.message}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
