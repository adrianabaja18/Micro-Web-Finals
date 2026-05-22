import { useEffect, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import {
  createBooking,
  deleteBooking,
  listenBookings,
  updateBookingStatus,
} from "../firebase/services";

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [createdQR, setCreatedQR] = useState(null);

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
            className="w-full rounded-xl border border-slate-300 px-4 py-3"
            required
          />

          <input
            name="contact"
            value={form.contact}
            onChange={handleChange}
            placeholder="Contact number/email"
            className="w-full rounded-xl border border-slate-300 px-4 py-3"
            required
          />

          <input
            name="property"
            value={form.property}
            onChange={handleChange}
            placeholder="Property / Room / Unit"
            className="w-full rounded-xl border border-slate-300 px-4 py-3"
            required
          />

          <input
            name="keyId"
            value={form.keyId}
            onChange={handleChange}
            placeholder="Key ID"
            className="w-full rounded-xl border border-slate-300 px-4 py-3"
            required
          />

          <div>
            <label className="text-sm text-slate-600">Access Start</label>
            <input
              name="accessStart"
              value={form.accessStart}
              onChange={handleChange}
              type="datetime-local"
              className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3"
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
              className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3"
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
                  <QRCodeCanvas value={createdQR.qrToken} size={180} />
                </div>

                <div>
                  <p className="text-sm text-slate-500">Guest</p>
                  <p className="font-bold">{createdQR.guestName}</p>

                  <p className="text-sm text-slate-500 mt-3">QR Token</p>
                  <p className="font-mono text-sm break-all bg-slate-100 p-3 rounded-xl">
                    {createdQR.qrToken}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm overflow-x-auto">
            <h2 className="text-lg font-bold mb-4">Booking List</h2>

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
                  <tr key={booking.id} className="border-b">
                    <td className="py-3 font-medium">{booking.guestName}</td>
                    <td>{booking.property}</td>
                    <td>{booking.keyId}</td>
                    <td>
                      <span className="px-3 py-1 rounded-full bg-slate-100 text-xs">
                        {booking.status}
                      </span>
                    </td>
                    <td className="font-mono max-w-[180px] truncate">
                      {booking.qrToken}
                    </td>
                    <td className="flex gap-2 py-2">
                      <button
                        onClick={() => updateBookingStatus(booking.id, "revoked")}
                        className="px-3 py-2 rounded-lg bg-yellow-100 text-yellow-700"
                      >
                        Revoke
                      </button>
                      <button
                        onClick={() => deleteBooking(booking.id)}
                        className="px-3 py-2 rounded-lg bg-red-100 text-red-700"
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
    </div>
  );
}