export type Result<T> =
  | { ok: true; value: T; meta?: Record<string, unknown> }
  | {
      ok: false;
      error: {
        code: string;
        messageKey: string;
        fieldErrors?: Record<string, string[]>;
        retryable: boolean;
      };
    };
export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(path, {
    credentials: "include",
    headers: { "content-type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const data = await response.json().catch(() => ({
    ok: false,
    error: {
      code: "HTTP",
      messageKey: "Invalid server response",
      retryable: true,
    },
  }));
  if (!response.ok || data?.ok === false)
    throw new Error(data?.error?.messageKey || `HTTP ${response.status}`);
  return data?.ok === true ? data.value : data;
}
export const post = <T>(path: string, body: unknown) =>
  api<T>(path, { method: "POST", body: JSON.stringify(body) });
export const patch = <T>(path: string, body: unknown) =>
  api<T>(path, { method: "PATCH", body: JSON.stringify(body) });
export const put = <T>(path: string, body: unknown) =>
  api<T>(path, { method: "PUT", body: JSON.stringify(body) });
