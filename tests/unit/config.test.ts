import { describe, expect, it } from "vitest";
import { readConfig } from "../../apps/server/src/config";

describe("server origin configuration", () => {
  it("accepts and normalizes legacy deployment origin variables", () => {
    const config = readConfig({
      RUNTIME_PROFILE: "test",
      PUBLIC_BASE_URL: "https://fonat.onrender.com/",
      WEB_ORIGIN: "https://fonat.onrender.com/",
    });

    expect(config.PUBLIC_APP_URL).toBe("https://fonat.onrender.com");
    expect(config.allowedOrigins).toEqual(["https://fonat.onrender.com"]);
  });

  it("uses Render's external URL without additional origin variables", () => {
    const config = readConfig({
      RUNTIME_PROFILE: "test",
      RENDER_EXTERNAL_URL: "https://fonat.onrender.com",
    });

    expect(config.PUBLIC_APP_URL).toBe("https://fonat.onrender.com");
    expect(config.allowedOrigins).toEqual(["https://fonat.onrender.com"]);
  });
});
