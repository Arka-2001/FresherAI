
import { initializeApp } from "firebase/app";
import {getAuth, GoogleAuthProvider} from "firebase/auth"
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_APIKEY,
  authDomain: "fresherai-bf2f5.firebaseapp.com",
  projectId: "fresherai-bf2f5",
  storageBucket: "fresherai-bf2f5.firebasestorage.app",
  messagingSenderId: "589884216888",
  appId: "1:589884216888:web:aec4d91bdf34aea5aa78cd"
};


const app = initializeApp(firebaseConfig);

const auth = getAuth(app)

const provider = new GoogleAuthProvider()

export {auth , provider}