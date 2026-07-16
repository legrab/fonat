import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "../../apps/web/src/api";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("web API failure handling", () => {
  it("does not attempt a request when the browser is definitely offline", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("navigator", { onLine: false });
    vi.stubGlobal("fetch", fetch);

    await expect(api("/api/test")).rejects.toMatchObject({
      name: "ApiError",
      code: "OFFLINE",
      status: 0,
      retryable: true,
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("turns transport failures into a retryable typed error", async () => {
    vi.stubGlobal("navigator", { onLine: true });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("Failed to fetch")),
    );

    await expect(api("/api/test")).rejects.toEqual(
      expect.objectContaining({
        name: "ApiError",
        code: "NETWORK",
        status: 0,
        retryable: true,
        technicalReference: "Failed to fetch",
      }),
    );
  });

  it("keeps typed server errors intact", async () => {
    vi.stubGlobal("navigator", { onLine: true });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            ok: false,
            error: {
              code: "CONFLICT",
              messageKey: "Revision conflict",
              retryable: false,
            },
          }),
          { status: 409, headers: { "content-type": "application/json" } },
        ),
      ),
    );

    await expect(api("/api/test")).rejects.toMatchObject({
      code: "CONFLICT",
      status: 409,
      retryable: false,
    });
  });
});
