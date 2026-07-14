import type { GraphNode, GraphRelation, NodeRevision } from '@fonat/contracts';
import { Badge, Button, Dialog, Select, Tabs, TextField } from '@radix-ui/themes';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { Empty, ErrorState, Loading } from '../components/AsyncState';
import { ContentEditor } from '../features/content-editor/ContentEditor';
import { RelationEditor } from '../features/relations/RelationEditor';
import { NodeRenderer, title } from '../components/NodeRenderer';
import { PageHeader } from '../components/PageHeader';

type Detail = {
  node: GraphNode;
  relations: GraphRelation[];
  revisions: NodeRevision[];
  related: GraphNode[];
};

const authorableTypes = [
  ['exercise', 'Feladat'],
  ['concept', 'Fogalom'],
  ['resource', 'Forrás'],
  ['collection', 'Gyűjtemény'],
  ['activity-template', 'Tevékenységsablon'],
  ['rubric', 'Értékelési szempontsor']
] as const;

function initialPayload(type: string): Record<string, unknown> {
  if (type === 'exercise')
    return {
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
    };
  if (type === 'resource') return { kind: 'markdown', markdown: '' };
  if (type === 'concept') return { aliases: [] };
  if (type === 'collection') return { memberIds: [] };
  if (type === 'activity-template')
    return {
      resourceIds: [],
      exerciseIds: [],
      durationMinutes: 10,
      grouping: 'whole-class',
      instructions: ''
    };
  if (type === 'rubric') return { criteria: [] };
  return {};
}

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
  const concepts = useQuery({
    queryKey: ['node-editor-concepts'],
    queryFn: () => api<{ items: GraphNode[] }>('/api/nodes?type=concept&limit=100')
  });
  const [conceptToAdd, setConceptToAdd] = useState('');
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
        version: 0,
        subjectIds: [],
        searchText: '',
        payload: initialPayload('exercise'),
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
        headers: isNew ? undefined : { 'If-Match': String(draft.version ?? 0) },
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
        subtitle={`${draft.type} · ${draft.lifecycle === 'published' ? 'közzétett' : 'piszkozat'}`}
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
              <Tabs.Trigger value="raw">Fejlesztői adatok</Tabs.Trigger>
            </Tabs.List>
            <Tabs.Content value="content">
              <NodeRenderer node={draft} />
            </Tabs.Content>
            <Tabs.Content value="edit">
              <div className="input-grid">
                {isNew ? (
                  <label>
                    Tartalomtípus
                    <Select.Root
                      value={draft.type}
                      onValueChange={(value) =>
                        setDraft({ ...draft, type: value, payload: initialPayload(value) })
                      }
                    >
                      <Select.Trigger />
                      <Select.Content>
                        {authorableTypes.map(([value, label]) => (
                          <Select.Item key={value} value={value}>
                            {label}
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Root>
                  </label>
                ) : null}
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
                  <>
                    <label>
                      Feladattípus
                      <Select.Root
                        value={String(draft.payload.exerciseType ?? 'manual-explanation')}
                        onValueChange={(value) =>
                          setDraft({ ...draft, payload: { ...draft.payload, exerciseType: value } })
                        }
                      >
                        <Select.Trigger />
                        <Select.Content>
                          {[
                            'single-choice',
                            'multi-select',
                            'true-false',
                            'numeric',
                            'short-text',
                            'ordered',
                            'manual-explanation'
                          ].map((value) => (
                            <Select.Item key={value} value={value}>
                              {value}
                            </Select.Item>
                          ))}
                        </Select.Content>
                      </Select.Root>
                    </label>
                    <label>
                      Becsült idő, perc
                      <TextField.Root
                        type="number"
                        min="1"
                        value={String(draft.payload.durationMinutes ?? 5)}
                        onChange={(event) =>
                          setDraft({
                            ...draft,
                            payload: { ...draft.payload, durationMinutes: Number(event.target.value) }
                          })
                        }
                      />
                    </label>
                    <ContentEditor value={prompt} onChange={setPrompt} label="Feladat szövege" />
                    <div className="span-2">
                      <label>Kapcsolódó fogalmak</label>
                      <div className="row wrap">
                        <Select.Root value={conceptToAdd} onValueChange={setConceptToAdd}>
                          <Select.Trigger placeholder="Fogalom keresése" />
                          <Select.Content>
                            {concepts.data?.items
                              .filter(
                                (concept) =>
                                  !(draft.payload.concepts as string[] | undefined)?.includes(concept.id)
                              )
                              .map((concept) => (
                                <Select.Item key={concept.id} value={concept.id}>
                                  {title(concept)}
                                </Select.Item>
                              ))}
                          </Select.Content>
                        </Select.Root>
                        <Button
                          type="button"
                          variant="soft"
                          disabled={!conceptToAdd}
                          onClick={() => {
                            const selected = (draft.payload.concepts as string[] | undefined) ?? [];
                            setDraft({
                              ...draft,
                              payload: { ...draft.payload, concepts: [...selected, conceptToAdd] }
                            });
                            setConceptToAdd('');
                          }}
                        >
                          Hozzáadás
                        </Button>
                      </div>
                      <div className="row wrap top-gap">
                        {((draft.payload.concepts as string[] | undefined) ?? []).map((conceptId) => {
                          const concept = concepts.data?.items.find((item) => item.id === conceptId);
                          return (
                            <Button
                              key={conceptId}
                              type="button"
                              size="1"
                              variant="soft"
                              onClick={() =>
                                setDraft({
                                  ...draft,
                                  payload: {
                                    ...draft.payload,
                                    concepts: ((draft.payload.concepts as string[]) ?? []).filter(
                                      (id) => id !== conceptId
                                    )
                                  }
                                })
                              }
                            >
                              {concept ? title(concept) : 'Ismeretlen fogalom'} ×
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                ) : null}
                {draft.type === 'resource' ? (
                  <ContentEditor
                    value={String(draft.payload.markdown ?? '')}
                    onChange={(value) =>
                      setDraft({ ...draft, payload: { ...draft.payload, kind: 'markdown', markdown: value } })
                    }
                    label="Forrás tartalma"
                  />
                ) : null}
                {draft.type === 'concept' ? (
                  <label className="span-2">
                    Álnevek, vesszővel
                    <TextField.Root
                      value={((draft.payload.aliases as string[] | undefined) ?? []).join(', ')}
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          payload: {
                            ...draft.payload,
                            aliases: event.target.value
                              .split(',')
                              .map((value) => value.trim())
                              .filter(Boolean)
                          }
                        })
                      }
                    />
                  </label>
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
              <p className="muted small">
                Belső azonosító: <code>{draft.id}</code>. A nyers szerkesztés fejlesztői menekülőút; a normál
                mezőket használd elsőként.
              </p>
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
            {!isNew && (
              <div style={{ marginBottom: 12 }}>
                <RelationEditor nodeId={draft.id} />
              </div>
            )}
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
