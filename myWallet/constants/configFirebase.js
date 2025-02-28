// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAnalytics } from "firebase/analytics";
import { getStorage } from "firebase/storage";
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
const app = initializeApp(firebaseConfig);
//const analytics = getAnalytics(app);
const database = getDatabase(app);
const storage = getStorage(app); 

export {app, database, storage}