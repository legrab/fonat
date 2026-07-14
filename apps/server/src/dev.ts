import { createApp } from "./app.js";
const context = await createApp({ logger: true });
await context.app.listen({ port: context.config.PORT, host: "0.0.0.0" });
const shutdown = async () => {
  await context.close();
  process.exit(0);
};
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
