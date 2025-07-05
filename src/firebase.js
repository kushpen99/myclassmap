import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCApjjpk7xcP7T-8uMREDHP61XGR4uWBQI",
  authDomain: "my-class-map.firebaseapp.com",
  projectId: "my-class-map",
  storageBucket: "my-class-map.firebasestorage.app",
  messagingSenderId: "1090228322362",
  appId: "1:1090228322362:web:f080205d4dacb434453503",
  measurementId: "G-V8VYYMGHN6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app; 