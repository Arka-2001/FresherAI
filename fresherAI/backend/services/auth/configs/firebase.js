import { initializeApp, cert } from "firebase-admin/app";
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
    console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT environment variable:", err);
  }
}

if (!serviceAccount) {
  const localKeyPath = path.resolve(__dirname, "../serviceAccountKey.json");
  if (fs.existsSync(localKeyPath)) {
    try {
      serviceAccount = JSON.parse(fs.readFileSync(localKeyPath, "utf-8"));
    } catch (err) {
      console.error("Failed to read local serviceAccountKey.json:", err);
    }
  } else {
    console.warn("⚠️ Firebase service account key not found!");
  }
}

export const app = initializeApp({
  credential: cert(serviceAccount),
});
