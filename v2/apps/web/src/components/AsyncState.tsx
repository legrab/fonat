import { Callout, Spinner } from '@radix-ui/themes';
import type { ReactNode } from 'react';

export function Loading({ label = 'Betöltés…' }: { label?: string }) {
  return (
    <div className="row muted">
      <Spinner /> {label}
    </div>
  );
}

export function ErrorState({ error }: { error: unknown }) {
  return (
    <Callout.Root color="red">
      <Callout.Text>{error instanceof Error ? error.message : 'Ismeretlen hiba történt.'}</Callout.Text>
    </Callout.Root>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="empty">{children}</div>;
}
