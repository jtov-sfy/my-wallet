// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAnalytics } from "firebase/analytics";
import { getStorage } from "firebase/storage";
import { ref, set } from "firebase/database";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyAb6bwGO8ZDzA1dVgm8sSWb-tIs3g5_6LE",
    authDomain: "my-budget-app-125c7.firebaseapp.com",
    databaseURL: "https://my-budget-app-125c7-default-rtdb.europe-west1.firebasedatabase.app/",
    projectId: "my-budget-app-125c7",
    storageBucket: "my-budget-app-125c7.firebasestorage.app",
    messagingSenderId: "287835362268",
    appId: "1:287835362268:web:0926d91cf83f7ac76af519",
    measurementId: "G-SK57999KEJ"
};

// Initialize Firebase
console.log('Initializing Firebase with config:', JSON.stringify(firebaseConfig));
let app, database, storage;

try {
  app = initializeApp(firebaseConfig);
  console.log('Firebase app initialized successfully');
  
  //const analytics = getAnalytics(app);
  database = getDatabase(app);
  console.log('Firebase database initialized successfully');
  
  storage = getStorage(app); 
  console.log('Firebase storage initialized successfully');
  
  // Test database connection
  setTimeout(async () => {
    try {
      console.log('Testing Firebase database connection...');
      const testRef = ref(database, 'test_connection');
      await set(testRef, { timestamp: new Date().toISOString(), status: 'connected' });
      console.log('Firebase database test write successful!');
    } catch (testError) {
      console.error('Firebase database test write failed:', testError);
    }
  }, 2000);
} catch (error) {
  console.error('Error initializing Firebase:', error);
  // Create dummy objects to prevent app crashes
  app = null;
  database = null;
  storage = null;
}

export { app, database, storage };