import { useEffect, useState } from "react";
import {
  clearNotifications,
  listenNotifications,
  markNotificationRead,
} from "../firebase/services";
import { CheckCheck, Trash2 } from "lucide-react";
import ConfirmModal from "../components/ConfirmModal";

const formatDate = (timestamp) => {
  if (!timestamp?.toDate) return "Pending...";
  return timestamp.toDate().toLocaleString();
};

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [clearMessage, setClearMessage] = useState("");
  const [isClearing, setIsClearing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

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

  const handleClearNotifications = async () => {
    setIsClearing(true);
    setClearMessage("");

    try {
      const result = await clearNotifications();
      setClearMessage(result.message);
      setConfirmOpen(false);
    } catch (error) {
      setClearMessage(error.message);
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="h-[calc(100vh-2rem)] md:h-[calc(100vh-4rem)] overflow-hidden flex flex-col">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-slate-500">
            Host alerts for key release, return, and invalid access.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleMarkAllAsRead}
            disabled={notifications.every((notif) => notif.read)}
            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-950 text-white hover:bg-slate-800 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCheck size={18} />
            Mark All as Read
          </button>

          <button
            onClick={() => setConfirmOpen(true)}
            disabled={isClearing || notifications.length === 0}
            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-600 text-white hover:bg-red-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 size={18} />
            {isClearing ? "Clearing..." : "Clear Notifications"}
          </button>
        </div>
      </div>

      {clearMessage && (
        <div className="mb-5 rounded-xl bg-blue-50 text-blue-700 px-4 py-3 text-sm shrink-0">
          {clearMessage}
        </div>
      )}

      <div className="mb-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between shrink-0">
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
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex-1 min-h-0 overflow-y-auto">
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
            <div className="p-8 text-center text-slate-500">
              {filterStatus === "unread"
                ? "No unread notifications."
                : filterStatus === "read"
                ? "No read notifications."
                : "No notifications yet."}
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        open={confirmOpen}
        title="Clear Notifications"
        message="Are you sure you want to clear all notifications? This action cannot be undone."
        confirmText="Clear Notifications"
        danger
        loading={isClearing}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleClearNotifications}
      />
    </div>
  );
}