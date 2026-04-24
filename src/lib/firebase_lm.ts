// Import the functions you need from the SDKs you need
// import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};

// Initialize Firebase
// const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);
// const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const app2 = getApps().find(app => app.name === "app2")
  ? getApp("app2")
  : initializeApp(firebaseConfig, "app2");

let analytics;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app2);
    }
  });
}

// 2. Inisialisasi Firestore database
const db2 = getFirestore(app2);

// 3. Jangan lupa tambahkan 'db' ke dalam export
export { app2, analytics, db2 };
