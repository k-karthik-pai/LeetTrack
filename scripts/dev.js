import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const backend = spawn(process.execPath, ["--watch", "server/index.js"], {
  cwd: root,
  stdio: "inherit",
  env: { ...process.env, NODE_ENV: "development" },
});
const frontend = spawn(process.execPath, ["node_modules/vite/bin/vite.js"], {
  cwd: root,
  stdio: "inherit",
});
let closing = false;
function close(code = 0) {
  if (closing) return;
  closing = true;
  backend.kill("SIGTERM");
  frontend.kill("SIGTERM");
  process.exitCode = code;
}
for (const child of [backend, frontend]) {
  child.on("error", (error) => {
    console.error(error.message);
    close(1);
  });
  child.on("exit", (code) => close(code || 0));
}
process.on("SIGINT", () => close());
process.on("SIGTERM", () => close());
