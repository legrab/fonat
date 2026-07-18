import { useCallback, useEffect, useRef, useState } from "react";
import { useBeforeUnload, useBlocker } from "react-router-dom";
import { useI18n } from "../i18n";

export function useUnsavedChanges(when: boolean) {
  const { t } = useI18n();
  const allowNavigationRef = useRef(false);
  const stayButtonRef = useRef<HTMLButtonElement>(null);
  const [pendingDiscard, setPendingDiscard] = useState<(() => void) | null>(
    null,
  );
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      when &&
      !allowNavigationRef.current &&
      `${currentLocation.pathname}${currentLocation.search}` !==
        `${nextLocation.pathname}${nextLocation.search}`,
  );

  useBeforeUnload(
    useCallback(
      (event) => {
        if (!when || allowNavigationRef.current) return;
        event.preventDefault();
        event.returnValue = "";
      },
      [when],
    ),
  );

  const stay = () => {
    setPendingDiscard(null);
    if (blocker.state === "blocked") blocker.reset();
  };
  const discard = () => {
    if (pendingDiscard) {
      const action = pendingDiscard;
      setPendingDiscard(null);
      action();
      return;
    }
    if (blocker.state === "blocked") blocker.proceed();
  };
  const blocked = blocker.state === "blocked" || pendingDiscard !== null;

  useEffect(() => {
    if (!blocked) return;
    stayButtonRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") stay();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [blocked, blocker, pendingDiscard]);

  const allowNavigation = () => {
    allowNavigationRef.current = true;
    window.setTimeout(() => {
      allowNavigationRef.current = false;
    }, 0);
  };
  const requestDiscard = (action: () => void) => {
    if (!when) {
      action();
      return;
    }
    setPendingDiscard(() => action);
  };

  return {
    allowNavigation,
    requestDiscard,
    confirmation: blocked ? (
      <div className="dialog-backdrop">
        <section
          className="panel unsaved-dialog stack"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="unsaved-dialog-title"
          aria-describedby="unsaved-dialog-description"
        >
          <h2 id="unsaved-dialog-title">{t("unsaved.title")}</h2>
          <p id="unsaved-dialog-description">{t("unsaved.body")}</p>
          <div className="row-actions">
            <button ref={stayButtonRef} onClick={stay}>
              {t("unsaved.stay")}
            </button>
            <button className="danger secondary" onClick={discard}>
              {t("unsaved.discard")}
            </button>
          </div>
        </section>
      </div>
    ) : null,
  };
}
