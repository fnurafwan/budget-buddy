import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBC99uNqFGwaDivfgo369Ql9aXCQ2SMiLs",
  authDomain: "budget-buddy-92c32.firebaseapp.com",
  projectId: "budget-buddy-92c32",
  storageBucket: "budget-buddy-92c32.firebasestorage.app",
  messagingSenderId: "462678414273",
  appId: "1:462678414273:web:5fcefffc093202ae431540",
  measurementId: "G-J4Q09NGR5C"
};

// Singleton pattern agar tidak initialize berkali-kali saat hot-reload
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app);