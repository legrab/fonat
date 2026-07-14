import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export function Markdown({ children }: { children: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
      {children}
    </ReactMarkdown>
  );
}

export function MarkdownEditor({
  value,
  onChange,
  label = 'Markdown'
}: {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}) {
  return (
    <div className="markdown-grid">
      <label className="stack">
        <strong>{label}</strong>
        <textarea className="textarea" value={value} onChange={(event) => onChange(event.target.value)} />
      </label>
      <div>
        <strong>Előnézet</strong>
        <div className="markdown-preview">
          <Markdown>{value || '*Az előnézet itt jelenik meg.*'}</Markdown>
        </div>
      </div>
    </div>
  );
}
