import { useSyncExternalStore } from "react";

function subscribeToConnectionStatus(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener("online", onStoreChange);
  window.addEventListener("offline", onStoreChange);
  return () => {
    window.removeEventListener("online", onStoreChange);
    window.removeEventListener("offline", onStoreChange);
  };
}

function getOnlineSnapshot() {
  return typeof navigator === "undefined" || navigator.onLine !== false;
}

export function useOnlineStatus() {
  return useSyncExternalStore(
    subscribeToConnectionStatus,
    getOnlineSnapshot,
    () => true,
  );
}

export function ConnectionStatus() {
  const online = useOnlineStatus();
  if (online) return null;

  return (
    <div className="connection-status" role="status" aria-live="polite">
      <strong>Nincs hálózati kapcsolat.</strong>
      <span>
        A nem mentett változtatások a szerkesztőben maradnak. Mentéshez várd
        meg, amíg helyreáll a kapcsolat.
      </span>
    </div>
  );
}

type EditorSaveStatusProps = {
  dirty: boolean;
  pending: boolean;
  saved: boolean;
};

export function EditorSaveStatus({
  dirty,
  pending,
  saved,
}: EditorSaveStatusProps) {
  const online = useOnlineStatus();
  const status = pending
    ? { label: "Mentés folyamatban…", tone: "pending" }
    : dirty && !online
      ? {
          label: "Nincs kapcsolat — a módosítások még nincsenek mentve.",
          tone: "warning",
        }
      : dirty
        ? { label: "Nem mentett módosítások", tone: "dirty" }
        : saved
          ? { label: "Minden változtatás mentve", tone: "saved" }
          : null;

  if (!status) return null;
  return (
    <p
      className={`editor-save-status ${status.tone}`}
      role="status"
      aria-live="polite"
    >
      <span aria-hidden="true" />
      {status.label}
    </p>
  );
}
