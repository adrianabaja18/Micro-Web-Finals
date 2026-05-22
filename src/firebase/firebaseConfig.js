import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDMdOSPFb1P-h0QsbF8ZAjbwV11VhAkTZM",
  authDomain: "micro-web-finals.firebaseapp.com",
  databaseURL:
    "https://micro-web-finals-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "micro-web-finals",
  storageBucket: "micro-web-finals.firebasestorage.app",
  messagingSenderId: "304421198693",
  appId: "1:304421198693:web:c9e38c486369d396535f8c",
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);
const realtimeDb = getDatabase(app);

export { auth, db, realtimeDb };
export default app;