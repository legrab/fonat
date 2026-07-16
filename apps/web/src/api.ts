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

export class ApiError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly status: number,
    readonly retryable: boolean,
    readonly fieldErrors: Record<string, string[]> = {},
    readonly technicalReference?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

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
  if (!response.ok || data?.ok === false) {
    const error = data?.error;
    throw new ApiError(
      error?.messageKey || `HTTP ${response.status}`,
      error?.code || "HTTP",
      response.status,
      Boolean(error?.retryable),
      error?.fieldErrors || {},
      error?.technicalReference,
    );
  }
  return data?.ok === true ? data.value : data;
}
export const post = <T>(path: string, body: unknown) =>
  api<T>(path, { method: "POST", body: JSON.stringify(body) });
export const patch = <T>(path: string, body: unknown) =>
  api<T>(path, { method: "PATCH", body: JSON.stringify(body) });
export const put = <T>(path: string, body: unknown) =>
  api<T>(path, { method: "PUT", body: JSON.stringify(body) });
