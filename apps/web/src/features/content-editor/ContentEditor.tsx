import { useEffect, useRef, useState } from 'react';
import { Button, Callout, Tabs } from '@radix-ui/themes';
import { Crepe, CrepeFeature } from '@milkdown/crepe';
import { replaceAll } from '@milkdown/kit/utils';
import '@milkdown/crepe/theme/common/style.css';
import '@milkdown/crepe/theme/frame.css';

type Props = {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  label?: string;
  error?: string;
  autosaveDelayMs?: number;
};

export function ContentEditor({
  value,
  onChange,
  readOnly = false,
  label = 'Tartalom',
  error,
  autosaveDelayMs = 500
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const crepeRef = useRef<Crepe | null>(null);
  const latestExternal = useRef(value);
  const initialValue = useRef(value);
  const initialReadOnly = useRef(readOnly);
  const onChangeRef = useRef(onChange);
  const autosaveDelayRef = useRef(autosaveDelayMs);
  const timerRef = useRef<number | undefined>(undefined);
  const [source, setSource] = useState(value);
  const [mode, setMode] = useState<'rich' | 'source'>('rich');
  const [status, setStatus] = useState<'ready' | 'editing' | 'saved'>('ready');

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);
  useEffect(() => {
    autosaveDelayRef.current = autosaveDelayMs;
  }, [autosaveDelayMs]);

  useEffect(() => {
    if (!rootRef.current) return;
    const crepe = new Crepe({
      root: rootRef.current,
      defaultValue: initialValue.current,
      features: { [CrepeFeature.TopBar]: true, [CrepeFeature.AI]: false }
    });
    crepe.setReadonly(initialReadOnly.current);
    crepe.on((listener) => {
      listener.markdownUpdated((_ctx, markdown, previous) => {
        if (markdown === previous) return;
        latestExternal.current = markdown;
        setSource(markdown);
        setStatus('editing');
        window.clearTimeout(timerRef.current);
        timerRef.current = window.setTimeout(() => {
          onChangeRef.current(markdown);
          setStatus('saved');
        }, autosaveDelayRef.current);
      });
    });
    void crepe.create();
    crepeRef.current = crepe;
    return () => {
      window.clearTimeout(timerRef.current);
      crepeRef.current = null;
      void crepe.destroy();
    };
  }, []);

  useEffect(() => {
    crepeRef.current?.setReadonly(readOnly);
  }, [readOnly]);

  useEffect(() => {
    if (value === latestExternal.current) return;
    latestExternal.current = value;
    setSource(value);
    crepeRef.current?.editor.action(replaceAll(value));
  }, [value]);

  const applySource = () => {
    latestExternal.current = source;
    crepeRef.current?.editor.action(replaceAll(source));
    onChange(source);
    setStatus('saved');
    setMode('rich');
  };

  return (
    <div className="content-editor stack" aria-label={label}>
      <div className="row-between">
        <strong>{label}</strong>
        <span className="muted small" aria-live="polite">
          {status === 'editing' ? 'Mentés…' : status === 'saved' ? 'Mentve' : 'Szerkeszthető Markdown'}
        </span>
      </div>
      <Tabs.Root value={mode} onValueChange={(next) => setMode(next as 'rich' | 'source')}>
        <Tabs.List>
          <Tabs.Trigger value="rich">Szerkesztő</Tabs.Trigger>
          <Tabs.Trigger value="source">Forrás</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="rich">
          <div ref={rootRef} className="crepe-host" />
        </Tabs.Content>
        <Tabs.Content value="source">
          <div className="stack source-editor">
            <textarea
              value={source}
              onChange={(event) => setSource(event.target.value)}
              rows={18}
              readOnly={readOnly}
              aria-label={`${label} Markdown forrás`}
            />
            {!readOnly && <Button onClick={applySource}>Forrás alkalmazása</Button>}
          </div>
        </Tabs.Content>
      </Tabs.Root>
      {error && (
        <Callout.Root color="red">
          <Callout.Text>{error}</Callout.Text>
        </Callout.Root>
      )}
    </div>
  );
}
