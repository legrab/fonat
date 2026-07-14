import type { Finding, GraphNode, GraphRelation, LessonPayload, NodeRevision } from '@fonat/contracts';
import { Badge, Button, Dialog } from '@radix-ui/themes';
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';
import { Empty, ErrorState, Loading } from '../components/AsyncState';
import { PageHeader } from '../components/PageHeader';
import { title } from '../components/NodeRenderer';

type Detail = {
  node: GraphNode;
  relations: GraphRelation[];
  revisions: NodeRevision[];
  related: GraphNode[];
};
type Recommendation = { node: GraphNode; score: number; reasons: string[]; rejected: string[] };

function SortableSection({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div ref={setNodeRef} style={style} className="lesson-section">
      <button className="drag-handle" aria-label="Szakasz húzása" {...attributes} {...listeners}>
        ⠿
      </button>
      {children}
    </div>
  );
}

export function LessonPage() {
  const { id } = useParams();
  const client = useQueryClient();
  const detail = useQuery({ queryKey: ['lesson', id], queryFn: () => api<Detail>(`/api/nodes/${id}`) });
  const findings = useQuery({
    queryKey: ['lesson-findings', id],
    queryFn: () => api<Finding[]>(`/api/lessons/${id}/validate`)
  });
  const [lesson, setLesson] = useState<GraphNode | null>(null);
  const [candidateSection, setCandidateSection] = useState<string | null>(null);
  useEffect(() => {
    if (detail.data?.node) setLesson(structuredClone(detail.data.node));
  }, [detail.data]);
  const recommendations = useQuery({
    queryKey: ['recommendations', id, candidateSection],
    enabled: Boolean(candidateSection),
    queryFn: () =>
      api<Recommendation[]>(
        `/api/lessons/${id}/recommendations?sectionId=${encodeURIComponent(candidateSection!)}`
      )
  });
  const save = useMutation({
    mutationFn: () => api<GraphNode>(`/api/nodes/${id}`, { method: 'PUT', body: JSON.stringify(lesson) }),
    onSuccess: async (node) => {
      setLesson(node);
      await Promise.all([
        client.invalidateQueries({ queryKey: ['lesson', id] }),
        client.invalidateQueries({ queryKey: ['lesson-findings', id] }),
        client.invalidateQueries({ queryKey: ['planning-lessons'] })
      ]);
    }
  });
  const publish = useMutation({
    mutationFn: () =>
      api(`/api/nodes/${id}/publish`, {
        method: 'POST',
        body: JSON.stringify({ compatibility: 'planning-impacting', reason: 'Óraterv közzététele.' })
      }),
    onSuccess: () => client.invalidateQueries({ queryKey: ['lesson', id] })
  });
  const activityNames = useMemo(
    () => new Map(detail.data?.related.map((item) => [item.id, title(item)]) ?? []),
    [detail.data]
  );
  if (detail.isLoading || !lesson)
    return (
      <div className="page">
        <Loading />
      </div>
    );
  if (detail.error)
    return (
      <div className="page">
        <ErrorState error={detail.error} />
      </div>
    );
  const payload = lesson.payload as LessonPayload;
  const total = payload.sections.reduce((sum, section) => sum + section.durationMinutes, 0);
  const moveSection = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= payload.sections.length) return;
    const sections = [...payload.sections];
    [sections[index], sections[target]] = [sections[target]!, sections[index]!];
    setLesson({ ...lesson, payload: { ...payload, sections } });
  };
  const dragSection = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = payload.sections.findIndex((section) => section.id === active.id);
    const to = payload.sections.findIndex((section) => section.id === over.id);
    if (from < 0 || to < 0) return;
    setLesson({ ...lesson, payload: { ...payload, sections: arrayMove(payload.sections, from, to) } });
  };
  const addCandidate = (sectionId: string, node: GraphNode) => {
    const sections = payload.sections.map((section) =>
      section.id === sectionId
        ? {
            ...section,
            activityIds: [...section.activityIds, node.id],
            slides: [
              ...section.slides,
              { id: crypto.randomUUID(), type: 'exercise' as const, exerciseId: node.id, teacherOnly: false }
            ]
          }
        : section
    );
    setLesson({
      ...lesson,
      payload: {
        ...payload,
        sections,
        pinnedRevisions: { ...payload.pinnedRevisions, [node.id]: node.currentRevision }
      }
    });
    setCandidateSection(null);
  };
  return (
    <div className="page">
      <PageHeader
        title={title(lesson)}
        subtitle={`${payload.intent} · ${payload.durationMinutes} perc · ${payload.status}`}
        actions={
          <>
            <Link to={`/presentation/start/${lesson.id}`}>
              <Button variant="soft">Bemutató mód</Button>
            </Link>
            <Button onClick={() => save.mutate()} loading={save.isPending}>
              {save.isSuccess ? 'Mentve' : 'Mentés'}
            </Button>
            <Button color="green" onClick={() => publish.mutate()} loading={publish.isPending}>
              Közzététel
            </Button>
          </>
        }
      />
      {save.error ? <ErrorState error={save.error} /> : null}
      <div className="grid grid-2">
        <section className="panel">
          <div className="row-between">
            <h2>Óravázlat</h2>
            <Badge color={total === payload.durationMinutes ? 'green' : 'amber'}>
              {total}/{payload.durationMinutes} perc
            </Badge>
          </div>
          <DndContext collisionDetection={closestCenter} onDragEnd={dragSection}>
            <SortableContext
              items={payload.sections.map((section) => section.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="lesson-sections">
                {payload.sections.map((section, index) => (
                  <SortableSection key={section.id} id={section.id}>
                    <div className="row-between">
                      <div>
                        <strong>{section.title}</strong>
                        <div className="muted small">
                          {section.durationMinutes} perc · {section.purpose}
                        </div>
                      </div>
                      <div className="toolbar">
                        <Button size="1" variant="ghost" onClick={() => moveSection(index, -1)}>
                          ↑
                        </Button>
                        <Button size="1" variant="ghost" onClick={() => moveSection(index, 1)}>
                          ↓
                        </Button>
                        <Dialog.Root
                          open={candidateSection === section.id}
                          onOpenChange={(open) => setCandidateSection(open ? section.id : null)}
                        >
                          <Dialog.Trigger>
                            <Button size="1" variant="soft">
                              Tartalom hozzáadása
                            </Button>
                          </Dialog.Trigger>
                          <Dialog.Content maxWidth="720px">
                            <Dialog.Title>Ajánlott tartalmak</Dialog.Title>
                            <Dialog.Description>
                              Az óra fogalmai, időkerete és nehézsége alapján, magyarázható pontszámmal.
                            </Dialog.Description>
                            {recommendations.isLoading ? (
                              <Loading />
                            ) : recommendations.error ? (
                              <ErrorState error={recommendations.error} />
                            ) : recommendations.data?.length ? (
                              <div className="data-list" style={{ marginTop: 16 }}>
                                {recommendations.data.map((candidate) => (
                                  <div className="data-row" key={candidate.node.id}>
                                    <div>
                                      <strong>{title(candidate.node)}</strong>
                                      <div className="muted small">
                                        {candidate.reasons.join(' · ')} · pont: {candidate.score}
                                      </div>
                                    </div>
                                    <Button onClick={() => addCandidate(section.id, candidate.node)}>
                                      Hozzáadás
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <Empty>Nincs megfelelő jelölt.</Empty>
                            )}
                          </Dialog.Content>
                        </Dialog.Root>
                      </div>
                    </div>
                    <div>
                      {section.activityIds.length ? (
                        section.activityIds.map((activityId) => (
                          <span className="activity-chip" key={activityId}>
                            {activityNames.get(activityId) ?? activityId}
                            <button
                              aria-label="Eltávolítás"
                              onClick={() =>
                                setLesson({
                                  ...lesson,
                                  payload: {
                                    ...payload,
                                    sections: payload.sections.map((item) =>
                                      item.id === section.id
                                        ? {
                                            ...item,
                                            activityIds: item.activityIds.filter(
                                              (value) => value !== activityId
                                            )
                                          }
                                        : item
                                    )
                                  }
                                })
                              }
                            >
                              ×
                            </button>
                          </span>
                        ))
                      ) : (
                        <span className="muted small">Még nincs tartalom.</span>
                      )}
                    </div>
                  </SortableSection>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </section>
        <aside className="stack">
          <section className="panel">
            <h2>Diagnosztikák</h2>
            {findings.isLoading ? (
              <Loading />
            ) : findings.error ? (
              <ErrorState error={findings.error} />
            ) : findings.data?.length ? (
              <div className="stack">
                {findings.data.map((finding) => (
                  <div key={finding.id} className={`finding ${finding.severity}`}>
                    <strong>{finding.title}</strong>
                    <div>{finding.message}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="status-line success">Nincs észlelt probléma.</div>
            )}
          </section>
          <section className="panel">
            <h2>Beállítások eredete</h2>
            <div className="data-list">
              <div className="data-row">
                <span>Tanítási profil</span>
                <code>{payload.teachingProfileId ?? 'alapértelmezett'}</code>
              </div>
              <div className="data-row">
                <span>Óravázlat</span>
                <code>{payload.blueprintId ?? 'egyedi'}</code>
              </div>
              <div className="data-row">
                <span>Elrendezés</span>
                <code>{payload.layoutId ?? 'alapértelmezett'}</code>
              </div>
            </div>
          </section>
          <section className="panel">
            <h2>Tanári jegyzet</h2>
            <textarea
              className="textarea"
              value={payload.teacherNotes}
              onChange={(event) =>
                setLesson({ ...lesson, payload: { ...payload, teacherNotes: event.target.value } })
              }
            />
          </section>
        </aside>
      </div>
    </div>
  );
}
