import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAJeFvsjIy3gYEAcXdU0A8Yd4Sfx-9SAEk",
  authDomain: "agrigaurd-6178d.firebaseapp.com",
  databaseURL: "https://agrigaurd-6178d-default-rtdb.firebaseio.com",
  projectId: "agrigaurd-6178d",
  storageBucket: "agrigaurd-6178d.firebasestorage.app",
  messagingSenderId: "189296423120",
  appId: "1:189296423120:web:2365076eb89d12fb462ed5"
};

const app = initializeApp(firebaseConfig);

export const database = getDatabase(app);