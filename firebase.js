//import firebase from 'firebase';
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { initializeFirestore } from "firebase/firestore";

var firebaseConfig = {
  apiKey: "API KEY",
  authDomain: "DOMAIN",
  databaseURL: "URL",
  projectId: "ID",
  storageBucket: "BUCKET",
  messagingSenderId: "SENDER_ID",
  appId: "APP_ID",
};
// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const db = initializeFirestore(firebaseApp, {
  experimentalForceLongPolling: true,
});
const auth = getAuth();
const storage = getStorage(firebaseApp);
//const storageRef = ref(storage, "some-child");
export { auth, storage };
export default db;
