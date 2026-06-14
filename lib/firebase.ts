import { getApp, getApps, initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBgSE9tlQbLCM8W4b4vylNv_fZxKb6tVBc",
  authDomain: "kedesen-summer-camp-2026.firebaseapp.com",
  databaseURL:
    "https://kedesen-summer-camp-2026-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "kedesen-summer-camp-2026",
  storageBucket: "kedesen-summer-camp-2026.firebasestorage.app",
  messagingSenderId: "4053773376",
  appId: "1:4053773376:web:675adf69c5ada8bf5843a5",
  measurementId: "G-T8ZMGQKWEL",
};

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const database = getDatabase(firebaseApp);

export async function initializeAnalytics() {
  if (typeof window !== "undefined" && (await isSupported())) {
    return getAnalytics(firebaseApp);
  }

  return null;
}
