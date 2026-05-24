import { useEffect, useState } from "react";
import { clearAccessLogs, listenLogs } from "../firebase/services";
import { Search, Trash2 } from "lucide-react";

const formatDate = (timestamp) => {
  if (!timestamp?.toDate) return "Pending...";
  return timestamp.toDate().toLocaleString();
};

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [clearMessage, setClearMessage] = useState("");
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    const unsubscribe = listenLogs(setLogs, 100);
    return unsubscribe;
  }, []);

  const filteredLogs = logs.filter((log) => {
    const query = searchQuery.toLowerCase();
    return (
      (log.guestName || "").toLowerCase().includes(query) ||
      (log.eventType || "").toLowerCase().includes(query) ||
      (log.message || "").toLowerCase().includes(query) ||
      (log.keyId || "").toLowerCase().includes(query)
    );
  });

  const handleClearLogs = async () => {
    const confirmed = window.confirm(
      "Clear all access logs? This action cannot be undone.",
    );

    if (!confirmed) return;

    setIsClearing(true);
    setClearMessage("");

    try {
      const result = await clearAccessLogs();
      setClearMessage(result.message);
    } catch (error) {
      setClearMessage(error.message);
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div>
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Access Logs</h1>
          <p className="text-slate-500">
            View QR scans, key releases, returns, and invalid attempts.
          </p>
        </div>

        <button
          onClick={handleClearLogs}
          disabled={isClearing || logs.length === 0}
          className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-600 text-white hover:bg-red-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Trash2 size={18} />
          {isClearing ? "Clearing..." : "Clear Logs"}
        </button>
      </div>

      {clearMessage && (
        <div className="mb-5 rounded-xl bg-blue-50 text-blue-700 px-4 py-3 text-sm">
          {clearMessage}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm overflow-x-auto">
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-3 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search by guest name, event type, message, or key..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-slate-900 outline-none"
          />
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-3">Time</th>
              <th>Event</th>
              <th>Message</th>
              <th>Guest</th>
              <th>Key</th>
            </tr>
          </thead>

          <tbody>
            {filteredLogs.map((log) => (
              <tr key={log.id} className="border-b">
                <td className="py-3 whitespace-nowrap">
                  {formatDate(log.createdAt)}
                </td>
                <td className="font-medium">{log.eventType}</td>
                <td>{log.message}</td>
                <td>{log.guestName || "-"}</td>
                <td>{log.keyId || "-"}</td>
              </tr>
            ))}

            {filteredLogs.length === 0 && (
              <tr>
                <td colSpan="5" className="py-6 text-center text-slate-500">
                  {searchQuery ? "No logs match your search." : "No logs yet."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-500 mt-4">
        Clearing logs only removes access log records. Notifications and booking
        records will remain.
      </p>
    </div>
  );
}
