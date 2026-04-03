import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAZOdgb9v08Wdx-rquE3GzA0xeC1SV_Auw",
  authDomain: "budget-buddy-673f1.firebaseapp.com",
  projectId: "budget-buddy-673f1",
  storageBucket: "budget-buddy-673f1.firebasestorage.app",
  messagingSenderId: "293715708191",
  appId: "1:293715708191:web:2fab5a188b6b592761882a",
  measurementId: "G-133J6MJ5B4"
};

// Singleton pattern agar tidak initialize berkali-kali saat hot-reload
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app);