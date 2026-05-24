import { useEffect, useState } from "react";
import { listenLogs } from "../firebase/services";
import { Search } from "lucide-react";

const formatDate = (timestamp) => {
  if (!timestamp?.toDate) return "Pending...";
  return timestamp.toDate().toLocaleString();
};

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

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

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Access Logs</h1>
        <p className="text-slate-500">
          View QR scans, key releases, returns, and invalid attempts.
        </p>
      </div>

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
    </div>
  );
}