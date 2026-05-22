import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "./firebaseConfig";

function generateToken() {
  const randomValues = crypto.getRandomValues(new Uint32Array(4));
  const randomString = Array.from(randomValues).join("-");
  return `QR-${Date.now()}-${randomString}`;
}

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
}

export async function deleteBooking(bookingId) {
  await deleteDoc(doc(db, "bookings", bookingId));
}

export function listenBookings(callback) {
  const q = query(collection(db, "bookings"), orderBy("createdAt", "desc"));

  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map((item) => ({
      id: item.id,
      ...item.data(),
    }));

    callback(data);
  });
}

export async function createOrUpdateKey(keyId, data) {
  await setDoc(
    doc(db, "keys", keyId),
    {
      ...data,
      updatedAt: serverTimestamp(),
      createdAt: data.createdAt || serverTimestamp(),
    },
    { merge: true }
  );

  await addLog({
    eventType: "KEY_REGISTERED",
    message: `${keyId} was registered or updated.`,
    keyId,
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
}

export function listenKeys(callback) {
  const q = query(collection(db, "keys"), orderBy("updatedAt", "desc"));

  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map((item) => ({
      id: item.id,
      ...item.data(),
    }));

    callback(data);
  });
}

export async function addLog(logData) {
  await addDoc(collection(db, "accessLogs"), {
    ...logData,
    createdAt: serverTimestamp(),
  });
}

export function listenLogs(callback, maxItems = 50) {
  const q = query(
    collection(db, "accessLogs"),
    orderBy("createdAt", "desc"),
    limit(maxItems)
  );

  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map((item) => ({
      id: item.id,
      ...item.data(),
    }));

    callback(data);
  });
}

export async function addNotification(notificationData) {
  await addDoc(collection(db, "notifications"), {
    ...notificationData,
    read: false,
    createdAt: serverTimestamp(),
  });
}

export function listenNotifications(callback) {
  const q = query(
    collection(db, "notifications"),
    orderBy("createdAt", "desc"),
    limit(20)
  );

  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map((item) => ({
      id: item.id,
      ...item.data(),
    }));

    callback(data);
  });
}

export async function markNotificationRead(notificationId) {
  await updateDoc(doc(db, "notifications", notificationId), {
    read: true,
  });
}

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