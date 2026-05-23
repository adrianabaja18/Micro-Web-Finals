import { useEffect, useState } from "react";
import {
  Cpu,
  KeyRound,
  Monitor,
  QrCode,
  Radio,
  RefreshCw,
  Send,
} from "lucide-react";
import {
  createDeviceIfMissing,
  listenBookings,
  listenCommands,
  listenDevice,
  sendDeviceCommand,
  simulateKeyDispense,
  updateDeviceStatus,
  validateQrToken,
  verifyReturnedKey,
} from "../firebase/services";

export default function DeviceControl() {
  const [device, setDevice] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [commands, setCommands] = useState([]);

  const [qrToken, setQrToken] = useState("");
  const [rfidUid, setRfidUid] = useState("");
  const [lcdMessage, setLcdMessage] = useState("");
  const [result, setResult] = useState(null);
  const [validatedBooking, setValidatedBooking] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    createDeviceIfMissing();

    const unsubDevice = listenDevice(setDevice);
    const unsubBookings = listenBookings(setBookings);
    const unsubCommands = listenCommands(setCommands);

    return () => {
      unsubDevice();
      unsubBookings();
      unsubCommands();
    };
  }, []);

  const activeBookings = bookings.filter(
    (booking) => booking.status === "active" || booking.status === "in_use"
  );

  async function handleValidateQr(e) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setValidatedBooking(null);

    try {
      const response = await validateQrToken(qrToken.trim());
      setResult(response);

      if (response.valid) {
        setValidatedBooking(response.booking);
      }
    } catch (error) {
      setResult({
        valid: false,
        code: "ERROR",
        message: error.message,
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleDispense() {
    if (!validatedBooking) {
      setResult({
        valid: false,
        code: "NO_VALID_BOOKING",
        message: "Validate a QR code first before dispensing.",
      });
      return;
    }

    setLoading(true);

    try {
      await simulateKeyDispense(validatedBooking);
      setResult({
        valid: true,
        code: "KEY_DISPENSED",
        message: "Key dispense simulation completed.",
      });
      setValidatedBooking(null);
      setQrToken("");
    } catch (error) {
      setResult({
        valid: false,
        code: "ERROR",
        message: error.message,
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyRfid(e) {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await verifyReturnedKey(rfidUid.trim());
      setResult(response);
      setRfidUid("");
    } catch (error) {
      setResult({
        valid: false,
        code: "ERROR",
        message: error.message,
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateLcd(e) {
    e.preventDefault();

    await updateDeviceStatus({
      lcdMessage,
      currentMode: "manual_lcd_update",
    });

    setResult({
      valid: true,
      code: "LCD_UPDATED",
      message: `LCD message updated to: ${lcdMessage}`,
    });
  }

  async function handleCommand(command) {
    setLoading(true);

    try {
      await sendDeviceCommand(command);

      setResult({
        valid: true,
        code: "COMMAND_SENT",
        message: `${command} command was saved to Firebase.`,
      });
    } catch (error) {
      setResult({
        valid: false,
        code: "ERROR",
        message: error.message,
      });
    } finally {
      setLoading(false);
    }
  }

  function copyToken(token) {
    navigator.clipboard.writeText(token);
    setQrToken(token);
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Device Control</h1>
        <p className="text-slate-500">
          Simulate ESP32 actions before the hardware is available.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Cpu className="text-slate-700" />
            <h2 className="text-lg font-bold">Device Status</h2>
          </div>

          <div className="space-y-3 text-sm">
            <Info label="Status" value={device?.status || "offline"} />
            <Info label="Mode" value={device?.currentMode || "standby"} />
            <Info label="LCD" value={device?.lcdMessage || "No message"} />
            <Info label="Motor" value={device?.motorStatus || "idle"} />
            <Info
              label="IR Detected"
              value={device?.irDetected ? "true" : "false"}
            />
            <Info label="Last QR" value={device?.lastScannedQr || "-"} />
            <Info label="Last RFID" value={device?.lastRfidUid || "-"} />
          </div>

          <div className="grid grid-cols-2 gap-2 mt-5">
            <button
              onClick={() =>
                updateDeviceStatus({
                  status: "online",
                  currentMode: "standby",
                  lcdMessage: "System Ready",
                })
              }
              className="px-3 py-2 rounded-xl bg-green-100 text-green-700 text-sm font-medium"
            >
              Set Online
            </button>

            <button
              onClick={() =>
                updateDeviceStatus({
                  status: "offline",
                  currentMode: "offline",
                  lcdMessage: "Device Offline",
                })
              }
              className="px-3 py-2 rounded-xl bg-red-100 text-red-700 text-sm font-medium"
            >
              Set Offline
            </button>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <QrCode className="text-slate-700" />
            <h2 className="text-lg font-bold">QR Validation Simulation</h2>
          </div>

          <form onSubmit={handleValidateQr} className="flex flex-col md:flex-row gap-3">
            <input
              value={qrToken}
              onChange={(e) => setQrToken(e.target.value)}
              placeholder="Paste QR token here"
              className="flex-1 rounded-xl border border-slate-300 px-4 py-3"
              required
            />

            <button
              disabled={loading}
              className="px-5 py-3 rounded-xl bg-slate-950 text-white font-semibold disabled:opacity-60"
            >
              Validate QR
            </button>
          </form>

          <div className="mt-4">
            <h3 className="font-semibold mb-2">Available Booking Tokens</h3>

            <div className="space-y-2 max-h-44 overflow-y-auto">
              {activeBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex flex-col md:flex-row md:items-center justify-between gap-2 bg-slate-50 rounded-xl p-3"
                >
                  <div>
                    <p className="font-medium">{booking.guestName}</p>
                    <p className="text-xs text-slate-500 font-mono break-all">
                      {booking.qrToken}
                    </p>
                  </div>

                  <button
                    onClick={() => copyToken(booking.qrToken)}
                    className="px-3 py-2 rounded-lg bg-slate-200 text-slate-700 text-sm"
                  >
                    Use Token
                  </button>
                </div>
              ))}

              {activeBookings.length === 0 && (
                <p className="text-sm text-slate-500">No active bookings.</p>
              )}
            </div>
          </div>

          <button
            onClick={handleDispense}
            disabled={!validatedBooking || loading}
            className="mt-5 w-full px-5 py-3 rounded-xl bg-blue-600 text-white font-semibold disabled:opacity-50"
          >
            Simulate Key Dispense
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Radio className="text-slate-700" />
            <h2 className="text-lg font-bold">RFID Return Simulation</h2>
          </div>

          <form onSubmit={handleVerifyRfid} className="space-y-3">
            <input
              value={rfidUid}
              onChange={(e) => setRfidUid(e.target.value)}
              placeholder="Enter RFID UID e.g. A1:B2:C3:D4"
              className="w-full rounded-xl border border-slate-300 px-4 py-3"
              required
            />

            <button
              disabled={loading}
              className="w-full px-5 py-3 rounded-xl bg-slate-950 text-white font-semibold disabled:opacity-60"
            >
              Verify Returned Key
            </button>
          </form>

          <p className="text-xs text-slate-500 mt-3">
            Use the RFID UID you registered in the Keys page.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Monitor className="text-slate-700" />
            <h2 className="text-lg font-bold">LCD Message Test</h2>
          </div>

          <form onSubmit={handleUpdateLcd} className="space-y-3">
            <input
              value={lcdMessage}
              onChange={(e) => setLcdMessage(e.target.value)}
              placeholder="Enter LCD message"
              className="w-full rounded-xl border border-slate-300 px-4 py-3"
              required
            />

            <button className="w-full px-5 py-3 rounded-xl bg-slate-950 text-white font-semibold">
              Update LCD Message
            </button>
          </form>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm mt-6">
        <div className="flex items-center gap-3 mb-4">
          <Send className="text-slate-700" />
          <h2 className="text-lg font-bold">Hardware Commands</h2>
        </div>

        <div className="grid md:grid-cols-4 gap-3">
          <CommandButton
            label="Test Motor Open"
            onClick={() => handleCommand("TEST_MOTOR_OPEN")}
          />
          <CommandButton
            label="Test Motor Close"
            onClick={() => handleCommand("TEST_MOTOR_CLOSE")}
          />
          <CommandButton
            label="LCD Test"
            onClick={() => handleCommand("LCD_TEST")}
          />
          <CommandButton
            label="Reset Device"
            onClick={() => handleCommand("RESET_DEVICE")}
          />
        </div>

        <div className="mt-5">
          <h3 className="font-semibold mb-2">Recent Commands</h3>

          <div className="space-y-2 max-h-44 overflow-y-auto">
            {commands.slice(0, 5).map((command) => (
              <div
                key={command.id}
                className="flex items-center justify-between bg-slate-50 rounded-xl p-3 text-sm"
              >
                <div>
                  <p className="font-medium">{command.command}</p>
                  <p className="text-slate-500">Status: {command.status}</p>
                </div>

                <RefreshCw size={16} className="text-slate-400" />
              </div>
            ))}

            {commands.length === 0 && (
              <p className="text-sm text-slate-500">No commands sent yet.</p>
            )}
          </div>
        </div>
      </div>

      {result && (
        <div
          className={`mt-6 rounded-2xl border p-5 ${
            result.valid
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <p className="font-bold">{result.code}</p>
          <p className="text-sm mt-1">{result.message}</p>
        </div>
      )}
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-right break-all">{value}</span>
    </div>
  );
}

function CommandButton({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium"
    >
      {label}
    </button>
  );
}