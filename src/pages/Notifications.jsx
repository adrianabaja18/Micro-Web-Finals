import { useEffect, useState } from "react";
import { listenNotifications, markNotificationRead } from "../firebase/services";

const formatDate = (timestamp) => {
  if (!timestamp?.toDate) return "Pending...";
  return timestamp.toDate().toLocaleString();
};

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [filterStatus, setFilterStatus] = useState("all"); // "all", "read", "unread"

  useEffect(() => {
    const unsubscribe = listenNotifications(setNotifications);
    return unsubscribe;
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllAsRead = async () => {
    const unreadNotifications = notifications.filter((n) => !n.read);
    for (const notif of unreadNotifications) {
      await markNotificationRead(notif.id);
    }
  };

  const filteredNotifications = notifications.filter((notif) => {
    if (filterStatus === "read") return notif.read;
    if (filterStatus === "unread") return !notif.read;
    return true;
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Notifications</h1>
        <p className="text-slate-500">
          Host alerts for key release, return, and invalid access.
        </p>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterStatus("all")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filterStatus === "all"
                ? "bg-slate-950 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterStatus("unread")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filterStatus === "unread"
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Unread {unreadCount > 0 && `(${unreadCount})`}
          </button>
          <button
            onClick={() => setFilterStatus("read")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filterStatus === "read"
                ? "bg-slate-950 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Read
          </button>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 font-medium transition"
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className="space-y-4">
        {filteredNotifications.map((notif) => (
          <div
            key={notif.id}
            className={`rounded-2xl border p-5 shadow-sm ${
              notif.read
                ? "bg-white border-slate-200"
                : "bg-blue-50 border-blue-200"
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h2 className="font-bold">{notif.title}</h2>
                <p className="text-slate-600">{notif.message}</p>
                <p className="text-xs text-slate-400 mt-2">
                  {formatDate(notif.createdAt)}
                </p>
              </div>

              {!notif.read && (
                <button
                  onClick={() => markNotificationRead(notif.id)}
                  className="px-4 py-2 rounded-xl bg-slate-950 text-white"
                >
                  Mark as read
                </button>
              )}
            </div>
          </div>
        ))}

        {filteredNotifications.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
            {filterStatus === "unread"
              ? "No unread notifications."
              : filterStatus === "read"
                ? "No read notifications."
                : "No notifications yet."}
          </div>
        )}
      </div>
    </div>
  );
}