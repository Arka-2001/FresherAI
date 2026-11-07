import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const services = [
  { name: "AUTH", dir: "services/auth", port: "8001" },
  { name: "RESUME", dir: "services/resume", port: "8002" },
  { name: "INTERVIEW", dir: "services/interview", port: "8003" },
  { name: "ROADMAP", dir: "services/roadmap", port: "8004" },
  { name: "BILLING", dir: "services/billing", port: "8005" },
  { 
    name: "GATEWAY", 
    dir: "gateway", 
    port: process.env.PORT || "8000" 
  },
];

console.log("=========================================");
console.log("🚀 Starting FresherAI Backend Services...");
console.log("=========================================");

const runningProcesses = new Map();

function startService({ name, dir, port }) {
  const servicePath = path.resolve(__dirname, dir);

  const child = spawn("node", ["index.js"], {
    cwd: servicePath,
    stdio: "inherit",
    shell: true,
    env: {
      ...process.env,
      PORT: port,
      AUTH_SERVICE_URL: "http://127.0.0.1:8001",
      RESUME_SERVICE_URL: "http://127.0.0.1:8002",
      INTERVIEW_SERVICE_URL: "http://127.0.0.1:8003",
      ROADMAP_SERVICE_URL: "http://127.0.0.1:8004",
      BILLING_SERVICE_URL: "http://127.0.0.1:8005",
    },
  });

  runningProcesses.set(name, child);

  child.on("error", (err) => {
    console.error(`❌ [${name}] failed to start:`, err);
  });

  child.on("exit", (code) => {
    runningProcesses.delete(name);
    if (code !== 0 && code !== null) {
      console.error(`⚠️ [${name}] process exited with code ${code}. Restarting in 3 seconds...`);
      setTimeout(() => startService({ name, dir, port }), 3000);
    }
  });
}

// Start microservices first
services.filter(s => s.name !== "GATEWAY").forEach(startService);

// Start Gateway after 1 second so microservices have bound to their ports
setTimeout(() => {
  const gateway = services.find(s => s.name === "GATEWAY");
  if (gateway) startService(gateway);
}, 1000);

const cleanShutdown = () => {
  console.log("\n🛑 Stopping all services...");
  runningProcesses.forEach((p) => {
    try {
      p.kill();
    } catch {}
  });
  process.exit(0);
};

process.on("SIGINT", cleanShutdown);
process.on("SIGTERM", cleanShutdown);
