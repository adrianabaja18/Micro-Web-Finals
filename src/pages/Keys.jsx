import { useEffect, useState } from "react";
import {
  createOrUpdateKey,
  deleteKeyRecord,
  listenKeys,
  updateKeyStatus,
} from "../firebase/services";
import { Trash2 } from "lucide-react";

export default function Keys() {
  const [keys, setKeys] = useState([]);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    keyId: "KEY_001",
    property: "",
    rfidUid: "",
    status: "available",
  });

  useEffect(() => {
    const unsubscribe = listenKeys(setKeys);
    return unsubscribe;
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSaveKey = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      await createOrUpdateKey(form.keyId, {
        property: form.property,
        rfidUid: form.rfidUid,
        status: form.status,
        currentBookingId: null,
      });

      setMessage(`${form.keyId} saved successfully.`);

      setForm({
        keyId: "KEY_001",
        property: "",
        rfidUid: "",
        status: "available",
      });
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handleDeleteKey = async (key) => {
    const confirmed = window.confirm(
      `Delete ${key.id}? This will remove the key record from the system.`,
    );

    if (!confirmed) return;

    setMessage("");

    try {
      await deleteKeyRecord(key);
      setMessage(`${key.id} deleted successfully.`);
    } catch (error) {
      setMessage(error.message);
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-700";
      case "dispensed":
        return "bg-blue-100 text-blue-700";
      case "maintenance":
        return "bg-yellow-100 text-yellow-700";
      case "missing":
        return "bg-red-100 text-red-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Keys</h1>
        <p className="text-slate-500">
          Register RFID-tagged keys and monitor their status.
        </p>
      </div>

      {message && (
        <div className="mb-5 rounded-xl bg-blue-50 text-blue-700 px-4 py-3 text-sm">
          {message}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <form
          onSubmit={handleSaveKey}
          className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4"
        >
          <h2 className="text-lg font-bold">Register Key</h2>

          <input
            name="keyId"
            value={form.keyId}
            onChange={handleChange}
            placeholder="Key ID"
            className="w-full rounded-xl border border-slate-300 px-4 py-3"
            required
          />

          <input
            name="property"
            value={form.property}
            onChange={handleChange}
            placeholder="Property / Unit"
            className="w-full rounded-xl border border-slate-300 px-4 py-3"
            required
          />

          <input
            name="rfidUid"
            value={form.rfidUid}
            onChange={handleChange}
            placeholder="RFID UID e.g. A1:B2:C3:D4"
            className="w-full rounded-xl border border-slate-300 px-4 py-3"
            required
          />

          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            className="w-full rounded-xl border border-slate-300 px-4 py-3"
          >
            <option value="available">Available</option>
            <option value="dispensed">Dispensed</option>
            <option value="maintenance">Maintenance</option>
            <option value="missing">Missing</option>
          </select>

          <button className="w-full bg-slate-950 text-white py-3 rounded-xl font-semibold hover:bg-slate-800">
            Save Key
          </button>
        </form>

        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm overflow-x-auto">
          <h2 className="text-lg font-bold mb-4">Key List</h2>

          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-3">Key ID</th>
                <th>Property</th>
                <th>RFID UID</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {keys.map((key) => (
                <tr key={key.id} className="border-b">
                  <td className="py-3 font-medium">{key.id}</td>
                  <td>{key.property}</td>
                  <td className="font-mono">{key.rfidUid}</td>
                  <td>
                    <span
                      className={`px-3 py-1 rounded-full text-xs ${getStatusStyle(
                        key.status,
                      )}`}
                    >
                      {key.status}
                    </span>
                  </td>
                  <td className="py-2">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => updateKeyStatus(key.id, "available")}
                        className="px-3 py-2 rounded-lg bg-green-100 text-green-700 hover:bg-green-200"
                      >
                        Available
                      </button>

                      <button
                        onClick={() => updateKeyStatus(key.id, "dispensed")}
                        className="px-3 py-2 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200"
                      >
                        Dispensed
                      </button>

                      <button
                        onClick={() => handleDeleteKey(key)}
                        disabled={
                          key.status === "dispensed" || key.currentBookingId
                        }
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        title={
                          key.status === "dispensed" || key.currentBookingId
                            ? "Cannot delete a key that is currently dispensed or linked to a booking."
                            : "Delete key"
                        }
                      >
                        <Trash2 size={16} />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {keys.length === 0 && (
                <tr>
                  <td colSpan="5" className="py-6 text-center text-slate-500">
                    No keys registered yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <p className="text-xs text-slate-500 mt-4">
            Note: A key cannot be deleted while it is dispensed or linked to an
            active booking.
          </p>
        </div>
      </div>
    </div>
  );
}
