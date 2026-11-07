import { initializeApp, cert, getApps } from "firebase-admin/app";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let serviceAccount;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } catch (err) {
    console.error("❌ Failed to parse FIREBASE_SERVICE_ACCOUNT JSON:", err.message);
  }
}

if (!serviceAccount) {
  const localKeyPath = path.resolve(__dirname, "../serviceAccountKey.json");
  if (fs.existsSync(localKeyPath)) {
    try {
      serviceAccount = JSON.parse(fs.readFileSync(localKeyPath, "utf-8"));
    } catch (err) {
      console.error("❌ Failed to read local serviceAccountKey.json:", err.message);
    }
  } else {
    console.warn("⚠️ Firebase service account key not found!");
  }
}

// Fix escaped newlines in private_key (common issue when pasting into cloud environment variables)
if (serviceAccount && typeof serviceAccount.private_key === "string") {
  serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
}

let firebaseApp;
if (getApps().length > 0) {
  firebaseApp = getApps()[0];
} else if (serviceAccount) {
  try {
    firebaseApp = initializeApp({
      credential: cert(serviceAccount),
    });
    console.log("✅ Firebase Admin SDK initialized successfully");
  } catch (err) {
    console.error("❌ Error initializing Firebase Admin with credential:", err.message);
    firebaseApp = initializeApp();
  }
} else {
  console.warn("⚠️ Initializing Firebase Admin without credentials");
  firebaseApp = initializeApp();
}

export const app = firebaseApp;
