// Firebase Configuration
// Replace these values with your actual Firebase project configuration
// Get this from: Firebase Console > Project Settings > General > Your apps > SDK setup and configuration

const firebaseConfig = {
    apiKey: "AIzaSyD8tN8r-ZcuM1iBfse5RHotw4Q9dcF3ks4",
    authDomain: "chordsapp-e10e7.firebaseapp.com",
    projectId: "chordsapp-e10e7",
    storageBucket: "chordsapp-e10e7.firebasestorage.app",
    messagingSenderId: "313148138831",
    appId: "1:313148138831:web:720b8e97cde4f68e5f913a"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase Authentication
const auth = firebase.auth();

// Export for use in other files
window.auth = auth;

console.log('Firebase initialized successfully');
