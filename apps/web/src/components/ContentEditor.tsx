import { useEffect, useRef, useState } from "react";
import { Crepe } from "@milkdown/crepe";
import { replaceAll } from "@milkdown/kit/utils";
export function ContentEditor({
  value,
  onChange,
  readOnly = false,
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  ariaLabel?: string;
}) {
  const root = useRef<HTMLDivElement>(null);
  const crepe = useRef<Crepe | undefined>(undefined);
  const currentMarkdown = useRef(value);
  const applyingExternalValue = useRef(false);
  const latest = useRef(onChange);
  const [ready, setReady] = useState(false);
  latest.current = onChange;
  useEffect(() => {
    if (!root.current) return;
    const instance = new Crepe({
      root: root.current,
      defaultValue: currentMarkdown.current,
    });
    instance.on((listener) => {
      listener.markdownUpdated((_ctx, markdown) => {
        currentMarkdown.current = markdown;
        if (!applyingExternalValue.current) latest.current(markdown);
      });
    });
    void instance.create().then(() => {
      crepe.current = instance;
      instance.setReadonly(readOnly);
      const loadedMarkdown = instance.getMarkdown();
      if (loadedMarkdown !== currentMarkdown.current) {
        applyingExternalValue.current = true;
        instance.editor.action(replaceAll(currentMarkdown.current));
        queueMicrotask(() => {
          applyingExternalValue.current = false;
        });
      }
      setReady(true);
    });
    return () => {
      crepe.current = undefined;
      void instance.destroy();
    };
  }, []);
  useEffect(() => {
    const instance = crepe.current;
    if (!instance || value === currentMarkdown.current) return;
    currentMarkdown.current = value;
    applyingExternalValue.current = true;
    instance.editor.action(replaceAll(value));
    queueMicrotask(() => {
      applyingExternalValue.current = false;
    });
  }, [value]);
  useEffect(() => {
    crepe.current?.setReadonly(readOnly);
  }, [readOnly]);
  return (
    <div
      className={`content-editor ${readOnly ? "readonly" : ""}`}
      ref={root}
      aria-label={ariaLabel}
      data-ready={ready}
      data-readonly={readOnly}
    />
  );
}
