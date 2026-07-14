import type { GraphNode, LessonPayload, Page } from '@fonat/contracts';
import { Badge, Button } from '@radix-ui/themes';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { Empty, ErrorState, Loading } from '../components/AsyncState';
import { PageHeader } from '../components/PageHeader';
import { title } from '../components/NodeRenderer';

export function PlanningPage() {
  const plans = useQuery({
    queryKey: ['annual-plans'],
    queryFn: () => api<Page<GraphNode>>('/api/nodes?type=annual-plan&limit=50')
  });
  const lessons = useQuery({
    queryKey: ['planning-lessons'],
    queryFn: () => api<Page<GraphNode>>('/api/nodes?type=lesson&limit=100')
  });
  if (plans.isLoading || lessons.isLoading)
    return (
      <div className="page">
        <Loading />
      </div>
    );
  if (plans.error || lessons.error)
    return (
      <div className="page">
        <ErrorState error={plans.error ?? lessons.error} />
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
          <h2>Éves tervek</h2>
          <div className="data-list">
            {plans.data?.items.map((plan) => (
              <div className="data-row" key={plan.id}>
                <div>
                  <strong>{title(plan)}</strong>
                  <div className="muted small">{String(plan.payload.schoolYear ?? '')}</div>
                </div>
                <Badge>{String((plan.payload.phaseIds as string[] | undefined)?.length ?? 0)} fázis</Badge>
              </div>
            ))}
          </div>
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
