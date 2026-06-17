import { initializeApp } from "firebase/app";

import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  Auth,
  getAuth,
  initializeAuth,
} from "firebase/auth";

// @ts-ignore
import { getReactNativePersistence } from "firebase/auth";

import {
  getFirestore,
  initializeFirestore,
} from "firebase/firestore";

import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey:
    "AIzaSyA9-eYhr2Bdadd4OWD17zIRszsz3LrxeBc",

  authDomain:
    "clube-da-caminhonete-be770.firebaseapp.com",

  projectId:
    "clube-da-caminhonete-be770",

  storageBucket:
    "clube-da-caminhonete-be770.firebasestorage.app",

  messagingSenderId:
    "559157035885",

  appId:
    "1:559157035885:web:dd265c86d0a3db6a6b9064",
};

const app = initializeApp(firebaseConfig);

initializeFirestore(app, {
  experimentalForceLongPolling: true,
});

let auth: Auth;

try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  auth = getAuth(app);
}

const db = getFirestore(app);

const storage = getStorage(app);

export { auth, db, storage };

export default app;