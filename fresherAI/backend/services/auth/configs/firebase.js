
import { initializeApp, cert } from "firebase-admin/app";

const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;

if (!serviceAccountJson) {
  throw new Error("FIREBASE_SERVICE_ACCOUNT environment variable is missing");
}

const serviceAccount = JSON.parse(serviceAccountJson);

export const app = initializeApp({
  credential: cert(serviceAccount),
});
