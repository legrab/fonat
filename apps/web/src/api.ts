import type { Result } from '@fonat/contracts';

const apiBase = import.meta.env.VITE_API_BASE ?? '';

export class ApiError extends Error {
  constructor(public readonly result: Extract<Result<never>, { ok: false }>) {
    super(result.error.message);
  }
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBase}${path}`, {
    credentials: 'include',
    headers: {
      ...(init?.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...init?.headers
    },
    ...init
  });
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return (await response.blob()) as T;
  }
  const result = (await response.json()) as Result<T>;
  if (!result.ok) throw new ApiError(result as Extract<Result<never>, { ok: false }>);
  return result.value;
}

export async function download(path: string, filename: string) {
  const response = await fetch(`${apiBase}${path}`, { credentials: 'include' });
  if (!response.ok) throw new Error(`Download failed: ${response.status}`);
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
