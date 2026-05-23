import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "./firebaseConfig";

function generateToken() {
  const randomValues = crypto.getRandomValues(new Uint32Array(4));
  const randomString = Array.from(randomValues).join("-");
  return `QR-${Date.now()}-${randomString}`;
}

function sortByCreatedAtDesc(data) {
  return data.sort((a, b) => {
    const timeA = a.createdAt?.toMillis?.() || 0;
    const timeB = b.createdAt?.toMillis?.() || 0;
    return timeB - timeA;
  });
}

function sortByUpdatedAtDesc(data) {
  return data.sort((a, b) => {
    const timeA = a.updatedAt?.toMillis?.() || 0;
    const timeB = b.updatedAt?.toMillis?.() || 0;
    return timeB - timeA;
  });
}

// =====================
// BOOKINGS
// =====================

export async function createBooking(bookingData) {
  const qrToken = generateToken();

  const docRef = await addDoc(collection(db, "bookings"), {
    ...bookingData,
    qrToken,
    status: "active",
    keyDispensed: false,
    keyReturned: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await addLog({
    eventType: "BOOKING_CREATED",
    message: `Booking created for ${bookingData.guestName}`,
    bookingId: docRef.id,
    keyId: bookingData.keyId,
    guestName: bookingData.guestName,
  });

  await addNotification({
    title: "New Booking Created",
    message: `${bookingData.guestName} has been assigned ${bookingData.keyId}.`,
    type: "info",
  });

  return {
    id: docRef.id,
    qrToken,
  };
}

export async function updateBookingStatus(bookingId, status) {
  await updateDoc(doc(db, "bookings", bookingId), {
    status,
    updatedAt: serverTimestamp(),
  });

  await addLog({
    eventType: "BOOKING_STATUS_UPDATED",
    message: `Booking status changed to ${status}.`,
    bookingId,
  });

  await addNotification({
    title: "Booking Updated",
    message: `Booking status changed to ${status}.`,
    type: "info",
  });
}

export async function deleteBooking(bookingId) {
  await deleteDoc(doc(db, "bookings", bookingId));

  await addLog({
    eventType: "BOOKING_DELETED",
    message: "A booking was deleted.",
    bookingId,
  });
}

export function listenBookings(callback) {
  return onSnapshot(collection(db, "bookings"), (snapshot) => {
    const data = snapshot.docs.map((item) => ({
      id: item.id,
      ...item.data(),
    }));

    callback(sortByCreatedAtDesc(data));
  });
}

// =====================
// KEYS
// =====================

export async function createOrUpdateKey(keyId, data) {
  await setDoc(
    doc(db, "keys", keyId),
    {
      ...data,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  await addLog({
    eventType: "KEY_REGISTERED",
    message: `${keyId} was registered or updated.`,
    keyId,
  });

  await addNotification({
    title: "Key Registered",
    message: `${keyId} was registered or updated.`,
    type: "info",
  });
}

export async function updateKeyStatus(keyId, status) {
  await updateDoc(doc(db, "keys", keyId), {
    status,
    updatedAt: serverTimestamp(),
  });

  await addLog({
    eventType: "KEY_STATUS_UPDATED",
    message: `${keyId} status changed to ${status}.`,
    keyId,
  });

  await addNotification({
    title: "Key Status Updated",
    message: `${keyId} status changed to ${status}.`,
    type: "info",
  });
}

export function listenKeys(callback) {
  return onSnapshot(collection(db, "keys"), (snapshot) => {
    const data = snapshot.docs.map((item) => ({
      id: item.id,
      ...item.data(),
    }));

    callback(sortByUpdatedAtDesc(data));
  });
}

// =====================
// QR VALIDATION
// =====================

export async function validateQrToken(qrToken) {
  await updateDeviceStatus({
    currentMode: "qr_scanning",
    lcdMessage: "Scanning QR...",
    lastScannedQr: qrToken,
  });

  const bookingQuery = query(
    collection(db, "bookings"),
    where("qrToken", "==", qrToken)
  );

  const bookingSnapshot = await getDocs(bookingQuery);

  if (bookingSnapshot.empty) {
    await addLog({
      eventType: "INVALID_QR",
      message: "Scanned QR token does not exist.",
    });

    await addNotification({
      title: "Invalid QR Attempt",
      message: "Someone scanned an unregistered QR code.",
      type: "warning",
    });

    await updateDeviceStatus({
      currentMode: "access_denied",
      lcdMessage: "Invalid QR",
    });

    return {
      valid: false,
      code: "INVALID_QR",
      message: "QR code does not exist.",
    };
  }

  const bookingDoc = bookingSnapshot.docs[0];
  const booking = {
    id: bookingDoc.id,
    ...bookingDoc.data(),
  };

  if (booking.status !== "active") {
    await addLog({
      eventType: "QR_REJECTED",
      message: `QR rejected because booking is ${booking.status}.`,
      bookingId: booking.id,
      keyId: booking.keyId,
      guestName: booking.guestName,
    });

    await updateDeviceStatus({
      currentMode: "access_denied",
      lcdMessage: "Access Denied",
    });

    return {
      valid: false,
      code: "BOOKING_NOT_ACTIVE",
      message: "Booking is not active.",
      booking,
    };
  }

  const now = new Date();
  const accessStart = new Date(booking.accessStart);
  const accessEnd = new Date(booking.accessEnd);

  if (now < accessStart) {
    await addLog({
      eventType: "QR_TOO_EARLY",
      message: "QR scanned before allowed access time.",
      bookingId: booking.id,
      keyId: booking.keyId,
      guestName: booking.guestName,
    });

    await updateDeviceStatus({
      currentMode: "access_denied",
      lcdMessage: "Too Early",
    });

    return {
      valid: false,
      code: "TOO_EARLY",
      message: "Access period has not started yet.",
      booking,
    };
  }

  if (now > accessEnd) {
    await addLog({
      eventType: "QR_EXPIRED",
      message: "QR scanned after allowed access time.",
      bookingId: booking.id,
      keyId: booking.keyId,
      guestName: booking.guestName,
    });

    await updateDeviceStatus({
      currentMode: "access_denied",
      lcdMessage: "QR Expired",
    });

    return {
      valid: false,
      code: "EXPIRED",
      message: "Access period has expired.",
      booking,
    };
  }

  if (booking.keyDispensed) {
    await addLog({
      eventType: "QR_ALREADY_USED",
      message: "QR was scanned but key was already dispensed.",
      bookingId: booking.id,
      keyId: booking.keyId,
      guestName: booking.guestName,
    });

    await updateDeviceStatus({
      currentMode: "access_denied",
      lcdMessage: "Already Used",
    });

    return {
      valid: false,
      code: "ALREADY_USED",
      message: "Key already dispensed for this booking.",
      booking,
    };
  }

  const keyQuery = query(
    collection(db, "keys"),
    where("__name__", "==", booking.keyId)
  );

  const keySnapshot = await getDocs(keyQuery);

  if (keySnapshot.empty) {
    await addLog({
      eventType: "KEY_NOT_FOUND",
      message: `${booking.keyId} does not exist.`,
      bookingId: booking.id,
      keyId: booking.keyId,
      guestName: booking.guestName,
    });

    await updateDeviceStatus({
      currentMode: "access_denied",
      lcdMessage: "Key Missing",
    });

    return {
      valid: false,
      code: "KEY_NOT_FOUND",
      message: "Assigned key does not exist.",
      booking,
    };
  }

  const key = {
    id: keySnapshot.docs[0].id,
    ...keySnapshot.docs[0].data(),
  };

  if (key.status !== "available") {
    await addLog({
      eventType: "KEY_NOT_AVAILABLE",
      message: `${booking.keyId} is not available.`,
      bookingId: booking.id,
      keyId: booking.keyId,
      guestName: booking.guestName,
    });

    await updateDeviceStatus({
      currentMode: "access_denied",
      lcdMessage: "Key Not Ready",
    });

    return {
      valid: false,
      code: "KEY_NOT_AVAILABLE",
      message: "Assigned key is not available.",
      booking,
      key,
    };
  }

  await addLog({
    eventType: "QR_VALIDATED",
    message: `QR validated for ${booking.guestName}.`,
    bookingId: booking.id,
    keyId: booking.keyId,
    guestName: booking.guestName,
  });

  await updateDeviceStatus({
    currentMode: "access_granted",
    lcdMessage: "Access Granted",
  });

  return {
    valid: true,
    code: "VALID_ACCESS",
    message: "QR is valid. Key can be dispensed.",
    booking,
    key,
  };
}

export async function simulateKeyDispense(booking) {
  if (!booking?.id || !booking?.keyId) {
    throw new Error("Missing booking information.");
  }

  await updateDoc(doc(db, "bookings", booking.id), {
    keyDispensed: true,
    keyReturned: false,
    status: "in_use",
    dispensedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await updateDoc(doc(db, "keys", booking.keyId), {
    status: "dispensed",
    currentBookingId: booking.id,
    lastDispensedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await addLog({
    eventType: "KEY_DISPENSED",
    message: `${booking.keyId} was dispensed for ${booking.guestName}.`,
    bookingId: booking.id,
    keyId: booking.keyId,
    guestName: booking.guestName,
  });

  await addNotification({
    title: "Key Dispensed",
    message: `${booking.keyId} was dispensed for ${booking.guestName}.`,
    type: "success",
  });

  await updateDeviceStatus({
    currentMode: "key_dispensed",
    motorStatus: "dispensed",
    lcdMessage: "Key Dispensed",
  });
}

// =====================
// RFID RETURN VERIFICATION
// =====================

export async function verifyReturnedKey(rfidUid) {
  await updateDeviceStatus({
    currentMode: "rfid_scanning",
    lcdMessage: "Verifying Key...",
    irDetected: true,
    lastRfidUid: rfidUid,
  });

  const keyQuery = query(collection(db, "keys"), where("rfidUid", "==", rfidUid));
  const keySnapshot = await getDocs(keyQuery);

  if (keySnapshot.empty) {
    await addLog({
      eventType: "INVALID_RFID",
      message: `RFID UID ${rfidUid} is not registered.`,
    });

    await addNotification({
      title: "Invalid Key Return",
      message: `An unregistered RFID key was inserted: ${rfidUid}`,
      type: "warning",
    });

    await updateDeviceStatus({
      currentMode: "return_rejected",
      lcdMessage: "Invalid Key",
    });

    return {
      valid: false,
      code: "INVALID_RFID",
      message: "RFID UID is not registered.",
    };
  }

  const key = {
    id: keySnapshot.docs[0].id,
    ...keySnapshot.docs[0].data(),
  };

  if (!key.currentBookingId) {
    await addLog({
      eventType: "NO_ACTIVE_BOOKING_FOR_KEY",
      message: `${key.id} was scanned but has no active booking.`,
      keyId: key.id,
    });

    await updateDeviceStatus({
      currentMode: "return_rejected",
      lcdMessage: "No Active Booking",
    });

    return {
      valid: false,
      code: "NO_ACTIVE_BOOKING",
      message: "This key has no active booking.",
      key,
    };
  }

  await updateDoc(doc(db, "keys", key.id), {
    status: "available",
    currentBookingId: null,
    lastReturnedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await updateDoc(doc(db, "bookings", key.currentBookingId), {
    keyReturned: true,
    status: "completed",
    returnedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await addLog({
    eventType: "KEY_RETURNED",
    message: `${key.id} was returned successfully.`,
    bookingId: key.currentBookingId,
    keyId: key.id,
  });

  await addNotification({
    title: "Key Returned",
    message: `${key.id} was returned successfully.`,
    type: "success",
  });

  await updateDeviceStatus({
    currentMode: "return_accepted",
    lcdMessage: "Return Accepted",
    motorStatus: "return_accepted",
    irDetected: false,
  });

  return {
    valid: true,
    code: "RETURN_ACCEPTED",
    message: "Key returned successfully.",
    key,
  };
}

// =====================
// LOGS
// =====================

export async function addLog(logData) {
  try {
    await addDoc(collection(db, "accessLogs"), {
      ...logData,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error adding log:", error);
  }
}

export function listenLogs(callback) {
  return onSnapshot(
    collection(db, "accessLogs"),
    (snapshot) => {
      const data = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }));

      callback(sortByCreatedAtDesc(data));
    },
    (error) => {
      console.error("Error listening to logs:", error);
      callback([]);
    }
  );
}

// =====================
// NOTIFICATIONS
// =====================

export async function addNotification(notificationData) {
  try {
    await addDoc(collection(db, "notifications"), {
      ...notificationData,
      read: false,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error adding notification:", error);
  }
}

export function listenNotifications(callback) {
  return onSnapshot(
    collection(db, "notifications"),
    (snapshot) => {
      const data = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }));

      callback(sortByCreatedAtDesc(data));
    },
    (error) => {
      console.error("Error listening to notifications:", error);
      callback([]);
    }
  );
}

export async function markNotificationRead(notificationId) {
  await updateDoc(doc(db, "notifications", notificationId), {
    read: true,
  });
}

// =====================
// DEVICE
// =====================

export async function createDeviceIfMissing() {
  await setDoc(
    doc(db, "devices", "DEVICE_001"),
    {
      name: "Main Key Dispenser",
      status: "offline",
      currentMode: "standby",
      lcdMessage: "System Ready",
      motorStatus: "idle",
      keySlotStatus: "empty",
      irDetected: false,
      lastScannedQr: "",
      lastRfidUid: "",
      lastError: "",
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function updateDeviceStatus(data) {
  await setDoc(
    doc(db, "devices", "DEVICE_001"),
    {
      ...data,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export function listenDevice(callback) {
  return onSnapshot(doc(db, "devices", "DEVICE_001"), (snapshot) => {
    if (snapshot.exists()) {
      callback({
        id: snapshot.id,
        ...snapshot.data(),
      });
    } else {
      callback(null);
    }
  });
}

// =====================
// COMMANDS
// =====================

export async function sendDeviceCommand(command, payload = {}) {
  const docRef = await addDoc(collection(db, "commands"), {
    deviceId: "DEVICE_001",
    command,
    payload,
    status: "pending",
    createdAt: serverTimestamp(),
  });

  await addLog({
    eventType: "DEVICE_COMMAND_SENT",
    message: `Command sent: ${command}`,
  });

  await addNotification({
    title: "Device Command Sent",
    message: `Command sent to ESP32: ${command}`,
    type: "info",
  });

  return docRef.id;
}

export function listenCommands(callback) {
  return onSnapshot(collection(db, "commands"), (snapshot) => {
    const data = snapshot.docs.map((item) => ({
      id: item.id,
      ...item.data(),
    }));

    callback(sortByCreatedAtDesc(data));
  });
}