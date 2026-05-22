import { useEffect, useState } from "react";
import { listenLogs } from "../firebase/services";

const formatDate = (timestamp) => {
  if (!timestamp?.toDate) return "Pending...";
  return timestamp.toDate().toLocaleString();
};

export default function Logs() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const unsubscribe = listenLogs(setLogs, 100);
    return unsubscribe;
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Access Logs</h1>
        <p className="text-slate-500">
          View QR scans, key releases, returns, and invalid attempts.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm overflow-x-auto">
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
            {logs.map((log) => (
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

            {logs.length === 0 && (
              <tr>
                <td colSpan="5" className="py-6 text-center text-slate-500">
                  No logs yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}