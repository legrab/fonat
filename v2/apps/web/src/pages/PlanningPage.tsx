import type { GraphNode, LessonPayload, Page } from '@fonat/contracts';
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Badge, Button, Select } from '@radix-ui/themes';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { Empty, ErrorState, Loading } from '../components/AsyncState';
import { PageHeader } from '../components/PageHeader';
import { title } from '../components/NodeRenderer';

function SortablePhase({
  phase,
  index,
  total,
  move
}: {
  phase: GraphNode;
  index: number;
  total: number;
  move: (from: number, to: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: phase.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div ref={setNodeRef} style={style} className="data-row">
      <button className="drag-handle" aria-label={`${title(phase)} húzása`} {...attributes} {...listeners}>
        ⠿
      </button>
      <div style={{ flex: 1 }}>
        <strong>{title(phase)}</strong>
        <div className="muted small">{Number(phase.payload.approximateLessons ?? 0)} tervezett óra</div>
      </div>
      <div className="row">
        <Button size="1" variant="soft" disabled={index === 0} onClick={() => move(index, index - 1)}>
          Fel
        </Button>
        <Button size="1" variant="soft" disabled={index === total - 1} onClick={() => move(index, index + 1)}>
          Le
        </Button>
      </div>
    </div>
  );
}

export function PlanningPage() {
  const client = useQueryClient();
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [phaseIds, setPhaseIds] = useState<string[]>([]);
  const plans = useQuery({
    queryKey: ['annual-plans'],
    queryFn: () => api<Page<GraphNode>>('/api/nodes?type=annual-plan&limit=50')
  });
  const phases = useQuery({
    queryKey: ['planning-phases'],
    queryFn: () => api<Page<GraphNode>>('/api/nodes?type=phase&limit=100')
  });
  const lessons = useQuery({
    queryKey: ['planning-lessons'],
    queryFn: () => api<Page<GraphNode>>('/api/nodes?type=lesson&limit=100')
  });
  useEffect(() => {
    if (!selectedPlanId && plans.data?.items[0]) setSelectedPlanId(plans.data.items[0].id);
  }, [plans.data, selectedPlanId]);
  const selectedPlan = plans.data?.items.find((plan) => plan.id === selectedPlanId);
  useEffect(() => {
    setPhaseIds((selectedPlan?.payload.phaseIds as string[] | undefined) ?? []);
  }, [selectedPlan]);
  const phaseMap = useMemo(
    () => new Map(phases.data?.items.map((phase) => [phase.id, phase])),
    [phases.data]
  );
  const orderedPhases = phaseIds
    .map((id) => phaseMap.get(id))
    .filter((phase): phase is GraphNode => Boolean(phase));
  const savePlan = useMutation({
    mutationFn: (nextPhaseIds: string[]) => {
      if (!selectedPlan) throw new Error('Nincs kiválasztott éves terv.');
      return api<GraphNode>(`/api/nodes/${selectedPlan.id}`, {
        method: 'PUT',
        headers: { 'If-Match': String(selectedPlan.version) },
        body: JSON.stringify({
          ...selectedPlan,
          payload: { ...selectedPlan.payload, phaseIds: nextPhaseIds }
        })
      });
    },
    onSuccess: (updated) => {
      setPhaseIds(updated.payload.phaseIds as string[]);
      void client.invalidateQueries({ queryKey: ['annual-plans'] });
    }
  });
  const persistOrder = (next: string[]) => {
    setPhaseIds(next);
    savePlan.mutate(next);
  };
  const move = (from: number, to: number) => persistOrder(arrayMove(phaseIds, from, to));
  const drag = (event: DragEndEvent) => {
    if (!event.over || event.active.id === event.over.id) return;
    const from = phaseIds.indexOf(String(event.active.id));
    const to = phaseIds.indexOf(String(event.over.id));
    if (from >= 0 && to >= 0) persistOrder(arrayMove(phaseIds, from, to));
  };

  if (plans.isLoading || phases.isLoading || lessons.isLoading)
    return (
      <div className="page">
        <Loading />
      </div>
    );
  if (plans.error || phases.error || lessons.error)
    return (
      <div className="page">
        <ErrorState error={plans.error ?? phases.error ?? lessons.error} />
      </div>
    );
  return (
    <div className="page">
      <PageHeader
        title="Tervezés"
        subtitle="Éves szerkezet, fázisok és konkrét órák ugyanannak a kapcsolt tervnek a nézetei."
        actions={
          <Link to="/planning/quick">
            <Button>Curriculum nélküli gyors óra</Button>
          </Link>
        }
      />
      <div className="grid grid-2">
        <section className="panel">
          <div className="row-between">
            <h2>Éves terv és fázisok</h2>
            <Select.Root value={selectedPlanId} onValueChange={setSelectedPlanId}>
              <Select.Trigger placeholder="Válassz tervet" />
              <Select.Content>
                {plans.data?.items.map((plan) => (
                  <Select.Item key={plan.id} value={plan.id}>
                    {title(plan)}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
          </div>
          {selectedPlan ? (
            <>
              <div className="muted small">
                {String(selectedPlan.payload.schoolYear ?? '')}. Húzd a fázisokat, vagy használd a
                billentyűzetbarát gombokat.
              </div>
              {savePlan.error ? <ErrorState error={savePlan.error} /> : null}
              <DndContext collisionDetection={closestCenter} onDragEnd={drag}>
                <SortableContext items={phaseIds} strategy={verticalListSortingStrategy}>
                  <div className="data-list">
                    {orderedPhases.map((phase, index) => (
                      <SortablePhase
                        key={phase.id}
                        phase={phase}
                        index={index}
                        total={orderedPhases.length}
                        move={move}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </>
          ) : (
            <Empty>Még nincs éves terv.</Empty>
          )}
        </section>
        <section className="panel">
          <h2>Órák</h2>
          {lessons.data?.items.length ? (
            <div className="data-list">
              {lessons.data.items.map((lesson) => {
                const payload = lesson.payload as LessonPayload;
                return (
                  <Link to={`/planning/lesson/${lesson.id}`} className="data-row" key={lesson.id}>
                    <div>
                      <strong>{title(lesson)}</strong>
                      <div className="muted small">
                        {payload.intent} · {payload.date ?? 'nincs dátum'}
                      </div>
                    </div>
                    <div className="row">
                      <Badge
                        color={
                          payload.status === 'completed'
                            ? 'green'
                            : payload.status === 'scheduled'
                              ? 'blue'
                              : 'gray'
                        }
                      >
                        {payload.status}
                      </Badge>
                      {payload.sections.reduce((sum, section) => sum + section.durationMinutes, 0) !==
                      payload.durationMinutes ? (
                        <Badge color="amber">⚠ idő</Badge>
                      ) : null}
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <Empty>Még nincs óra.</Empty>
          )}
        </section>
      </div>
    </div>
  );
}
