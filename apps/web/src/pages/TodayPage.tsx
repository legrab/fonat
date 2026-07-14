import type { GraphNode, LessonPayload } from '@fonat/contracts';
import { Badge, Button, Card, Flex, Heading, Text } from '@radix-ui/themes';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { Empty, ErrorState, Loading } from '../components/AsyncState';
import { PageHeader } from '../components/PageHeader';
import { title } from '../components/NodeRenderer';

type TodayData = {
  nextLesson: GraphNode | null;
  upcoming: GraphNode[];
  reviewCount: number;
  activities: Array<{ id: string; message: string; createdAt: string; severity: string; targetId?: string }>;
  quickActions: string[];
};

export function TodayPage() {
  const query = useQuery({ queryKey: ['today'], queryFn: () => api<TodayData>('/api/today') });
  if (query.isLoading)
    return (
      <div className="page">
        <Loading />
      </div>
    );
  if (query.error)
    return (
      <div className="page">
        <ErrorState error={query.error} />
      </div>
    );
  const data = query.data!;
  const nextPayload = data.nextLesson?.payload as LessonPayload | undefined;
  return (
    <div className="page">
      <PageHeader
        title="Ma"
        subtitle="A következő hasznos lépés, nem egy statisztikai műszerfal."
        actions={
          <Link to="/planning/quick">
            <Button>Gyors óratervezés</Button>
          </Link>
        }
      />
      <div className="grid grid-2">
        <Card>
          <Flex direction="column" gap="3">
            <Heading size="5">Következő óra</Heading>
            {data.nextLesson ? (
              <>
                <Text size="5" weight="bold">
                  {title(data.nextLesson)}
                </Text>
                <Text color="gray">
                  {nextPayload?.date ?? 'Még nincs dátum'} · {nextPayload?.durationMinutes} perc
                </Text>
                <Flex gap="2" wrap="wrap">
                  <Link to={`/planning/lesson/${data.nextLesson.id}`}>
                    <Button>Előkészítés</Button>
                  </Link>
                  <Link to={`/presentation/start/${data.nextLesson.id}`}>
                    <Button variant="soft">Bemutató mód</Button>
                  </Link>
                </Flex>
              </>
            ) : (
              <Empty>Nincs ütemezett óra.</Empty>
            )}
          </Flex>
        </Card>
        <Card>
          <Flex direction="column" gap="3">
            <Heading size="5">Figyelmet kér</Heading>
            <div className="data-row">
              <span>Átnézendő beadások</span>
              <Badge color={data.reviewCount ? 'amber' : 'green'}>{data.reviewCount}</Badge>
            </div>
            <Link className="card-link" to="/assessments">
              Értékelések és eredmények megnyitása
            </Link>
            <Link className="card-link" to="/planning">
              Éves terv és diagnosztikák
            </Link>
          </Flex>
        </Card>
      </div>
      <div className="grid grid-2" style={{ marginTop: 16 }}>
        <section className="panel">
          <h2>Közelgő órák</h2>
          <div className="data-list">
            {data.upcoming.length ? (
              data.upcoming.map((lesson) => {
                const payload = lesson.payload as LessonPayload;
                return (
                  <Link className="data-row" key={lesson.id} to={`/planning/lesson/${lesson.id}`}>
                    <div>
                      <strong>{title(lesson)}</strong>
                      <div className="muted small">{payload.intent}</div>
                    </div>
                    <span>{payload.date ?? 'nincs dátum'}</span>
                  </Link>
                );
              })
            ) : (
              <Empty>Nincs közelgő óra.</Empty>
            )}
          </div>
        </section>
        <section className="panel">
          <h2>Legutóbbi tevékenység</h2>
          <div className="data-list">
            {data.activities.map((activity) => (
              <div key={activity.id} className={`status-line ${activity.severity}`}>
                <div>{activity.message}</div>
                <div className="muted small">{new Date(activity.createdAt).toLocaleString('hu-HU')}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
