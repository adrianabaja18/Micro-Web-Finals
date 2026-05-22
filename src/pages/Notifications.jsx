import { useEffect, useState } from "react";
import { listenNotifications, markNotificationRead } from "../firebase/services";

const formatDate = (timestamp) => {
  if (!timestamp?.toDate) return "Pending...";
  return timestamp.toDate().toLocaleString();
};

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const unsubscribe = listenNotifications(setNotifications);
    return unsubscribe;
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Notifications</h1>
        <p className="text-slate-500">
          Host alerts for key release, return, and invalid access.
        </p>
      </div>

      <div className="space-y-4">
        {notifications.map((notif) => (
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

        {notifications.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
            No notifications yet.
          </div>
        )}
      </div>
    </div>
  );
}