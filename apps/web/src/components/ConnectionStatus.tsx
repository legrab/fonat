import { useSyncExternalStore } from "react";
import { useI18n } from "../i18n";

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
  const { t } = useI18n();
  if (online) return null;

  return (
    <div className="connection-status" role="status" aria-live="polite">
      <strong>{t("connection.offlineTitle")}</strong>
      <span>{t("connection.offlineBody")}</span>
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
  const { t } = useI18n();
  const status = pending
    ? { label: t("save.pending"), tone: "pending" }
    : dirty && !online
      ? { label: t("save.offlineDirty"), tone: "warning" }
      : dirty
        ? { label: t("save.dirty"), tone: "dirty" }
        : saved
          ? { label: t("save.saved"), tone: "saved" }
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
