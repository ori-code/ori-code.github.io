import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
    apiKey: "AIzaSyD8tN8r-ZcuM1iBfse5RHotw4Q9dcF3ks4",
    authDomain: "chordsapp-e10e7.firebaseapp.com",
    databaseURL: "https://chordsapp-e10e7-default-rtdb.firebaseio.com",
    projectId: "chordsapp-e10e7",
    storageBucket: "chordsapp-e10e7.firebasestorage.app",
    messagingSenderId: "313148138831",
    appId: "1:313148138831:web:720b8e97cde4f68e5f913a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Realtime Database
export const database = getDatabase(app);

export default app;
