import { useEffect, useRef } from "react";
import { Crepe } from "@milkdown/crepe";
export function ContentEditor({
  value,
  onChange,
  readOnly = false,
}: {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
}) {
  const root = useRef<HTMLDivElement>(null);
  const latest = useRef(onChange);
  latest.current = onChange;
  useEffect(() => {
    if (!root.current) return;
    const crepe = new Crepe({ root: root.current, defaultValue: value });
    crepe.on((listener) => {
      listener.markdownUpdated((_ctx, markdown) => latest.current(markdown));
    });
    void crepe.create().then(() => {
      if (readOnly) root.current?.setAttribute("data-readonly", "true");
    });
    return () => {
      void crepe.destroy();
    };
  }, []);
  return (
    <div
      className={`content-editor ${readOnly ? "readonly" : ""}`}
      ref={root}
    />
  );
}
