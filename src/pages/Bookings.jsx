import { useEffect, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import {
  createBooking,
  deleteBooking,
  listenBookings,
  updateBookingStatus,
  overrideDispenseKey,
} from "../firebase/services";
import {
  X,
  Copy,
  QrCode,
  CalendarDays,
  KeyRound,
  User,
  Download,
} from "lucide-react";

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [createdQR, setCreatedQR] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [copied, setCopied] = useState(false);
  const [overrideLoading, setOverrideLoading] = useState(false);
  const [overrideMessage, setOverrideMessage] = useState("");

  const [form, setForm] = useState({
    guestName: "",
    contact: "",
    property: "",
    keyId: "KEY_001",
    accessStart: "",
    accessEnd: "",
  });

  useEffect(() => {
    const unsubscribe = listenBookings(setBookings);
    return unsubscribe;
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleCreateBooking = async (e) => {
    e.preventDefault();

    const result = await createBooking(form);

    setCreatedQR({
      bookingId: result.id,
      qrToken: result.qrToken,
      guestName: form.guestName,
    });

    setForm({
      guestName: "",
      contact: "",
      property: "",
      keyId: "KEY_001",
      accessStart: "",
      accessEnd: "",
    });
  };

  const handleGrantAccess = async (booking) => {
  const confirmed = window.confirm(
    `Grant access again for ${booking.guestName}? This will reactivate the booking.`
  );

  if (!confirmed) return;

  try {
    await updateBookingStatus(booking.id, "active");
    setOverrideMessage("Booking access has been granted again.");
  } catch (error) {
    setOverrideMessage(error.message);
  }
};

  const handleCopyToken = async (token) => {
    await navigator.clipboard.writeText(token);
    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 1500);
  };

  const handleOverrideDispense = async (booking) => {
    const confirmed = window.confirm(
      `Manual override will dispense ${booking.keyId} for ${booking.guestName} without QR validation. Continue?`,
    );

    if (!confirmed) return;

    setOverrideLoading(true);
    setOverrideMessage("");

    try {
      const result = await overrideDispenseKey(booking);
      setOverrideMessage(result.message);
    } catch (error) {
      setOverrideMessage(error.message);
    } finally {
      setOverrideLoading(false);
    }
  };

  const handleDownloadQR = (canvasId, guestName = "guest") => {
    const canvas = document.getElementById(canvasId);

    if (!canvas) {
      alert("QR code not found.");
      return;
    }

    const pngUrl = canvas
      .toDataURL("image/png")
      .replace("image/png", "image/octet-stream");

    const safeGuestName = guestName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-");

    const downloadLink = document.createElement("a");
    downloadLink.href = pngUrl;
    downloadLink.download = `${safeGuestName}-qr-code.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  const formatDateTime = (dateValue) => {
    if (!dateValue) return "-";

    try {
      return new Date(dateValue).toLocaleString();
    } catch {
      return dateValue;
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-700";
      case "in_use":
        return "bg-blue-100 text-blue-700";
      case "completed":
        return "bg-slate-100 text-slate-700";
      case "revoked":
        return "bg-red-100 text-red-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Bookings</h1>
        <p className="text-slate-500">
          Create guest access records and generate QR codes.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <form
          onSubmit={handleCreateBooking}
          className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4"
        >
          <h2 className="text-lg font-bold">Create Booking</h2>

          <input
            name="guestName"
            value={form.guestName}
            onChange={handleChange}
            placeholder="Guest name"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-slate-900"
            required
          />

          <input
            name="contact"
            value={form.contact}
            onChange={handleChange}
            placeholder="Contact number/email"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-slate-900"
            required
          />

          <input
            name="property"
            value={form.property}
            onChange={handleChange}
            placeholder="Property / Room / Unit"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-slate-900"
            required
          />

          <input
            name="keyId"
            value={form.keyId}
            onChange={handleChange}
            placeholder="Key ID"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-slate-900"
            required
          />

          <div>
            <label className="text-sm text-slate-600">Access Start</label>
            <input
              name="accessStart"
              value={form.accessStart}
              onChange={handleChange}
              type="datetime-local"
              className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-slate-900"
              required
            />
          </div>

          <div>
            <label className="text-sm text-slate-600">Access End</label>
            <input
              name="accessEnd"
              value={form.accessEnd}
              onChange={handleChange}
              type="datetime-local"
              className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-slate-900"
              required
            />
          </div>

          <button className="w-full bg-slate-950 text-white py-3 rounded-xl font-semibold hover:bg-slate-800">
            Generate QR Booking
          </button>
        </form>

        <div className="lg:col-span-2 space-y-6">
          {createdQR && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <h2 className="text-lg font-bold mb-4">Generated QR Code</h2>

              <div className="flex flex-col md:flex-row gap-6 items-center">
                <div className="bg-white p-4 rounded-xl border">
                  <QRCodeCanvas
                    id="created-booking-qr"
                    value={createdQR.qrToken}
                    size={180}
                  />
                </div>

                <div className="w-full">
                  <p className="text-sm text-slate-500">Guest</p>
                  <p className="font-bold">{createdQR.guestName}</p>

                  <p className="text-sm text-slate-500 mt-3">QR Token</p>
                  <div className="flex gap-2 mt-1">
                    <p className="font-mono text-sm break-all bg-slate-100 p-3 rounded-xl flex-1">
                      {createdQR.qrToken}
                    </p>
                    <button
                      onClick={() => handleCopyToken(createdQR.qrToken)}
                      className="px-4 rounded-xl bg-slate-950 text-white"
                      type="button"
                    >
                      <Copy size={18} />
                    </button>
                  </div>

                  {copied && (
                    <p className="text-sm text-green-600 mt-2">Token copied.</p>
                  )}
                  <button
                    onClick={() =>
                      handleDownloadQR(
                        "created-booking-qr",
                        createdQR.guestName,
                      )
                    }
                    className="mt-3 inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 font-medium"
                    type="button"
                  >
                    <Download size={18} />
                    Download QR Code
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm overflow-x-auto">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-lg font-bold">Booking List</h2>
                <p className="text-sm text-slate-500">
                  Click a booking row to view full details and QR code.
                </p>
              </div>
            </div>

            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-3">Guest</th>
                  <th>Property</th>
                  <th>Key</th>
                  <th>Status</th>
                  <th>QR Token</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {bookings.map((booking) => (
                  <tr
                    key={booking.id}
                    onClick={() => setSelectedBooking(booking)}
                    className="border-b hover:bg-slate-50 cursor-pointer transition"
                  >
                    <td className="py-3 font-medium">{booking.guestName}</td>
                    <td>{booking.property}</td>
                    <td>{booking.keyId}</td>
                    <td>
                      <span
                        className={`px-3 py-1 rounded-full text-xs ${getStatusStyle(
                          booking.status,
                        )}`}
                      >
                        {booking.status}
                      </span>
                    </td>
                    <td className="font-mono max-w-[180px] truncate">
                      {booking.qrToken}
                    </td>
                    <td
                      className="flex gap-2 py-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() =>
                          updateBookingStatus(booking.id, "revoked")
                        }
                        className="px-3 py-2 rounded-lg bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                      >
                        Revoke
                      </button>
                      <button
                        onClick={() => deleteBooking(booking.id)}
                        className="px-3 py-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}

                {bookings.length === 0 && (
                  <tr>
                    <td colSpan="6" className="py-6 text-center text-slate-500">
                      No bookings yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between rounded-t-3xl">
              <div>
                <h2 className="text-xl font-bold">Booking Details</h2>
                <p className="text-sm text-slate-500">
                  View or resend the renter’s QR access code.
                </p>
              </div>

              <button
                onClick={() => setSelectedBooking(null)}
                className="h-10 w-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 grid lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className="text-slate-600" />
                  <div>
                    <p className="text-sm text-slate-500">Guest Name</p>
                    <p className="font-bold">{selectedBooking.guestName}</p>
                  </div>
                </div>

                <DetailItem label="Contact" value={selectedBooking.contact} />
                <DetailItem
                  label="Property / Unit"
                  value={selectedBooking.property}
                />

                <div className="flex items-center gap-3">
                  <KeyRound className="text-slate-600" />
                  <div>
                    <p className="text-sm text-slate-500">Assigned Key</p>
                    <p className="font-bold">{selectedBooking.keyId}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <CalendarDays className="text-slate-600" />
                  <div>
                    <p className="text-sm text-slate-500">Access Period</p>
                    <p className="font-medium">
                      {formatDateTime(selectedBooking.accessStart)}
                    </p>
                    <p className="font-medium">
                      to {formatDateTime(selectedBooking.accessEnd)}
                    </p>
                  </div>
                </div>

                <DetailItem label="Booking ID" value={selectedBooking.id} />

                <div>
                  <p className="text-sm text-slate-500">Status</p>
                  <span
                    className={`inline-flex mt-1 px-3 py-1 rounded-full text-xs ${getStatusStyle(
                      selectedBooking.status,
                    )}`}
                  >
                    {selectedBooking.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <StatusBox
                    label="Key Dispensed"
                    value={selectedBooking.keyDispensed ? "Yes" : "No"}
                  />
                  <StatusBox
                    label="Key Returned"
                    value={selectedBooking.keyReturned ? "Yes" : "No"}
                  />
                  <StatusBox
                    label="Override Used"
                    value={selectedBooking.overrideUsed ? "Yes" : "No"}
                  />
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
                <div className="flex items-center gap-3 mb-4">
                  <QrCode className="text-slate-700" />
                  <h3 className="font-bold">QR Access Code</h3>
                </div>

                <div className="flex justify-center">
                  <div className="bg-white p-4 rounded-2xl border border-slate-200">
                    <QRCodeCanvas
                      id={`booking-qr-${selectedBooking.id}`}
                      value={selectedBooking.qrToken}
                      size={220}
                    />
                  </div>
                </div>

                <div className="mt-5">
                  <p className="text-sm text-slate-500 mb-1">Full QR Token</p>
                  <div className="flex gap-2">
                    <p className="font-mono text-sm break-all bg-white border border-slate-200 p-3 rounded-xl flex-1">
                      {selectedBooking.qrToken}
                    </p>

                    <button
                      onClick={() => handleCopyToken(selectedBooking.qrToken)}
                      className="px-4 rounded-xl bg-slate-950 text-white hover:bg-slate-800"
                      title="Copy token"
                    >
                      <Copy size={18} />
                    </button>
                  </div>

                  {copied && (
                    <p className="text-sm text-green-600 mt-2">
                      QR token copied.
                    </p>
                  )}
                  <button
                    onClick={() =>
                      handleDownloadQR(
                        `booking-qr-${selectedBooking.id}`,
                        selectedBooking.guestName,
                      )
                    }
                    className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 font-medium"
                    type="button"
                  >
                    <Download size={18} />
                    Download QR Code
                  </button>
                </div>

                <div className="mt-5 p-4 rounded-xl bg-blue-50 text-blue-700 text-sm">
                  The host can show this QR code to the renter again if the
                  original QR was lost.
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 px-6 py-4">
              {overrideMessage && (
                <div className="mb-4 rounded-xl bg-blue-50 text-blue-700 px-4 py-3 text-sm">
                  {overrideMessage}
                </div>
              )}

              <div className="flex flex-col md:flex-row gap-3 justify-end">
                <button
                  onClick={() => handleOverrideDispense(selectedBooking)}
                  disabled={
                    overrideLoading ||
                    selectedBooking.keyDispensed ||
                    selectedBooking.status === "completed" ||
                    selectedBooking.status === "revoked"
                  }
                  className="px-5 py-3 rounded-xl bg-red-600 text-white hover:bg-red-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-red-600"
                  title={
                    selectedBooking.status === "revoked"
                      ? "Cannot override a revoked booking. Grant access first."
                      : selectedBooking.keyDispensed
                        ? "Key is already dispensed."
                        : selectedBooking.status === "completed"
                          ? "Booking is already completed."
                          : "Manually dispense this key without QR validation."
                  }
                >
                  {overrideLoading ? "Processing..." : "Override Dispense Key"}
                </button>

                {selectedBooking.status === "revoked" ? (
                  <button
                    onClick={() => handleGrantAccess(selectedBooking)}
                    className="px-5 py-3 rounded-xl bg-green-600 text-white hover:bg-green-700 font-medium"
                  >
                    Grant Access
                  </button>
                ) : (
                  <button
                    onClick={() =>
                      updateBookingStatus(selectedBooking.id, "revoked")
                    }
                    disabled={
                      selectedBooking.status === "completed" ||
                      selectedBooking.keyDispensed
                    }
                    className="px-5 py-3 rounded-xl bg-yellow-100 text-yellow-700 hover:bg-yellow-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Revoke Access
                  </button>
                )}

                <button
                  onClick={() => setSelectedBooking(null)}
                  className="px-5 py-3 rounded-xl bg-slate-950 text-white hover:bg-slate-800 font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailItem({ label, value }) {
  return (
    <div>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="font-medium break-all">{value || "-"}</p>
    </div>
  );
}

function StatusBox({ label, value }) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="font-bold">{value}</p>
    </div>
  );
}
