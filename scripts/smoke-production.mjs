import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
const port = 31991;
const child = spawn(process.execPath, ["apps/server/dist/dev.js"], {
  stdio: ["ignore", "pipe", "pipe"],
  env: {
    ...process.env,
    RUNTIME_PROFILE: "demo",
    PORT: String(port),
    PUBLIC_APP_URL: `http://127.0.0.1:${port}`,
    ALLOWED_ORIGINS: `http://127.0.0.1:${port}`,
    SESSION_SECRET: "production-smoke-secret-at-least-32-characters",
  },
});
let log = "";
child.stdout.on("data", (d) => (log += d));
child.stderr.on("data", (d) => (log += d));
try {
  let response;
  for (let i = 0; i < 40; i++) {
    try {
      response = await fetch(`http://127.0.0.1:${port}/api/health`);
      if (response.ok) break;
    } catch {}
    await delay(250);
  }
  if (!response?.ok) throw new Error(`Server did not become healthy. ${log}`);
  const health = await response.json();
  const ui = await fetch(`http://127.0.0.1:${port}/`);
  if (!ui.ok || !(await ui.text()).includes("Fonat"))
    throw new Error("Static frontend smoke failed");
  const login = await fetch(`http://127.0.0.1:${port}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      email: "admin@fonat.local",
      password: "fonat-demo",
    }),
  });
  if (!login.ok) throw new Error(`Login smoke failed: ${login.status}`);
  const cookie = login.headers.get("set-cookie")?.split(";")[0];
  if (!cookie) throw new Error("Login did not return a session cookie");
  const today = await fetch(`http://127.0.0.1:${port}/api/today`, {
    headers: { cookie },
  });
  if (!today.ok)
    throw new Error(`Authenticated API smoke failed: ${today.status}`);
  const logout = await fetch(`http://127.0.0.1:${port}/api/auth/logout`, {
    method: "POST",
    headers: { cookie, "content-type": "application/json" },
    body: "{}",
  });
  if (!logout.ok) throw new Error("Logout smoke failed");
  console.log(
    `Production smoke passed: ${health.value?.status || "ok"}, UI, login, authenticated API, logout.`,
  );
} finally {
  child.kill("SIGTERM");
  await delay(100);
}
