import type { GraphNode, GraphRelation, NodeRevision } from '@fonat/contracts';
import { Badge, Button, Dialog, Tabs, TextField } from '@radix-ui/themes';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { Empty, ErrorState, Loading } from '../components/AsyncState';
import { MarkdownEditor } from '../components/Markdown';
import { NodeRenderer, title } from '../components/NodeRenderer';
import { PageHeader } from '../components/PageHeader';

type Detail = {
  node: GraphNode;
  relations: GraphRelation[];
  revisions: NodeRevision[];
  related: GraphNode[];
};

export function NodeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const client = useQueryClient();
  const isNew = id === 'new';
  const query = useQuery({
    queryKey: ['node', id],
    enabled: !isNew,
    queryFn: () => api<Detail>(`/api/nodes/${id}`)
  });
  const [draft, setDraft] = useState<GraphNode | null>(null);
  useEffect(() => {
    if (query.data?.node) setDraft(structuredClone(query.data.node));
  }, [query.data]);
  useEffect(() => {
    if (isNew) {
      const now = new Date().toISOString();
      setDraft({
        id: `teacher.${crypto.randomUUID()}`,
        type: 'exercise',
        title: { canonicalLanguage: 'hu', values: { hu: 'Új feladat' } },
        lifecycle: 'draft',
        quality: 'experimental',
        currentRevision: 1,
        payload: {
          exerciseType: 'manual-explanation',
          prompt: { canonicalLanguage: 'hu', values: { hu: 'Írd ide a feladatot.' } },
          options: [],
          acceptedAnswers: [],
          durationMinutes: 5,
          difficulty: {
            cognitive: 3,
            prerequisites: 3,
            independence: 3,
            teacherPreparation: 1,
            collaboration: 1
          },
          evidenceIntensity: 'light',
          concepts: [],
          purpose: ['practice'],
          scaffold: [],
          grading: {},
          presentation: {}
        },
        extensions: {},
        provenance: { origin: 'teacher' },
        rights: { status: 'teacher-owned', redistributionAllowed: false },
        tags: [],
        createdAt: now,
        updatedAt: now
      });
    }
  }, [isNew]);
  const save = useMutation({
    mutationFn: async () => {
      if (!draft) throw new Error('Nincs menthető tartalom.');
      return api<GraphNode>(isNew ? '/api/nodes' : `/api/nodes/${draft.id}`, {
        method: isNew ? 'POST' : 'PUT',
        body: JSON.stringify(draft)
      });
    },
    onSuccess: async (node) => {
      await client.invalidateQueries({ queryKey: ['nodes'] });
      if (isNew) navigate(`/library/${node.id}`);
      else await client.invalidateQueries({ queryKey: ['node', id] });
    }
  });
  const publish = useMutation({
    mutationFn: (compatibility: string) =>
      api(`/api/nodes/${id}/publish`, { method: 'POST', body: JSON.stringify({ compatibility }) }),
    onSuccess: () => client.invalidateQueries({ queryKey: ['node', id] })
  });
  if (!isNew && query.isLoading)
    return (
      <div className="page">
        <Loading />
      </div>
    );
  if (!isNew && query.error)
    return (
      <div className="page">
        <ErrorState error={query.error} />
      </div>
    );
  if (!draft)
    return (
      <div className="page">
        <Loading />
      </div>
    );
  const prompt =
    draft.type === 'exercise'
      ? String((draft.payload.prompt as { values?: Record<string, string> } | undefined)?.values?.hu ?? '')
      : '';
  const setPrompt = (value: string) =>
    setDraft((current) =>
      current
        ? {
            ...current,
            payload: { ...current.payload, prompt: { canonicalLanguage: 'hu', values: { hu: value } } }
          }
        : current
    );
  return (
    <div className="page">
      <PageHeader
        title={title(draft)}
        subtitle={draft.id}
        actions={
          <>
            <Button variant="soft" onClick={() => window.print()}>
              Nyomtatás
            </Button>
            <Button onClick={() => save.mutate()} loading={save.isPending}>
              {save.isSuccess ? 'Mentve' : 'Mentés'}
            </Button>
            {!isNew ? (
              <Dialog.Root>
                <Dialog.Trigger>
                  <Button color="green">Közzététel</Button>
                </Dialog.Trigger>
                <Dialog.Content>
                  <Dialog.Title>Új változat közzététele</Dialog.Title>
                  <Dialog.Description>
                    Válaszd ki, milyen hatással lehet a változás a meglévő órákra.
                  </Dialog.Description>
                  <div className="stack" style={{ marginTop: 16 }}>
                    {[
                      'presentation-only',
                      'content-equivalent',
                      'planning-impacting',
                      'contract-breaking'
                    ].map((kind) => (
                      <Button key={kind} variant="soft" onClick={() => publish.mutate(kind)}>
                        {kind}
                      </Button>
                    ))}
                  </div>
                </Dialog.Content>
              </Dialog.Root>
            ) : null}
          </>
        }
      />
      {save.error ? <ErrorState error={save.error} /> : null}
      <div className="grid grid-2">
        <section className="panel">
          <Tabs.Root defaultValue="content">
            <Tabs.List>
              <Tabs.Trigger value="content">Tartalom</Tabs.Trigger>
              <Tabs.Trigger value="edit">Szerkesztés</Tabs.Trigger>
              <Tabs.Trigger value="raw">Nyers adatok</Tabs.Trigger>
            </Tabs.List>
            <Tabs.Content value="content">
              <NodeRenderer node={draft} />
            </Tabs.Content>
            <Tabs.Content value="edit">
              <div className="input-grid">
                <label>
                  Cím
                  <TextField.Root
                    value={draft.title.values.hu ?? ''}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        title: { ...draft.title, values: { ...draft.title.values, hu: event.target.value } }
                      })
                    }
                  />
                </label>
                {draft.type === 'exercise' ? (
                  <MarkdownEditor value={prompt} onChange={setPrompt} label="Feladat szövege" />
                ) : null}
                <label>
                  Címkék
                  <input
                    className="input"
                    value={draft.tags.join(', ')}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        tags: event.target.value
                          .split(',')
                          .map((value) => value.trim())
                          .filter(Boolean)
                      })
                    }
                  />
                </label>
              </div>
            </Tabs.Content>
            <Tabs.Content value="raw">
              <textarea
                className="textarea"
                style={{ minHeight: 520, fontFamily: 'monospace' }}
                value={JSON.stringify(draft.payload, null, 2)}
                onChange={(event) => {
                  try {
                    setDraft({
                      ...draft,
                      payload: JSON.parse(event.target.value) as Record<string, unknown>
                    });
                  } catch {
                    /* keep typing until valid */
                  }
                }}
              />
            </Tabs.Content>
          </Tabs.Root>
        </section>
        <aside className="stack">
          <section className="panel">
            <h2>Kapcsolódó</h2>
            {query.data?.related.length ? (
              <div className="data-list">
                {query.data.related.map((item) => (
                  <Link className="card-link" to={`/library/${item.id}`} key={item.id}>
                    {title(item)} <Badge>{item.type}</Badge>
                  </Link>
                ))}
              </div>
            ) : (
              <Empty>Nincs közvetlen kapcsolat.</Empty>
            )}
          </section>
          <section className="panel">
            <h2>Változatok</h2>
            {query.data?.revisions.length ? (
              query.data.revisions.map((revision) => (
                <div className="status-line" key={revision.id}>
                  <strong>v{revision.revision}</strong> · {revision.compatibility}
                  <div className="muted small">{revision.compatibilityReason}</div>
                </div>
              ))
            ) : (
              <Empty>Még nincs közzétett változat.</Empty>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
