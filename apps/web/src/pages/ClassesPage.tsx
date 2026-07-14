import type { GraphNode, LearnerProfile, Page, Submission } from '@fonat/contracts';
import { Badge, Card } from '@radix-ui/themes';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';
import { Empty, ErrorState, Loading } from '../components/AsyncState';
import { PageHeader } from '../components/PageHeader';
import { title } from '../components/NodeRenderer';

export function ClassesPage() {
  const query = useQuery({
    queryKey: ['classrooms'],
    queryFn: () => api<Page<GraphNode>>('/api/nodes?type=classroom&limit=50')
  });
  return (
    <div className="page">
      <PageHeader
        title="Osztályok"
        subtitle="Névtelen, álneves vagy adminisztratív azonosítással is használható tanulói terek."
      />
      {query.isLoading ? (
        <Loading />
      ) : query.error ? (
        <ErrorState error={query.error} />
      ) : query.data?.items.length ? (
        <div className="grid grid-2">
          {query.data.items.map((classroom) => (
            <Link to={`/classes/${classroom.id}`} key={classroom.id}>
              <Card>
                <h2>{title(classroom)}</h2>
                <div className="row">
                  <Badge>{String(classroom.payload.grade)}. évfolyam</Badge>
                  <Badge>{String(classroom.payload.subject)}</Badge>
                  {classroom.payload.demo ? <Badge color="amber">demó</Badge> : null}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Empty>Nincs osztály.</Empty>
      )}
    </div>
  );
}

export function ClassroomPage() {
  const { id } = useParams();
  const classroom = useQuery({
    queryKey: ['classroom', id],
    queryFn: () => api<{ node: GraphNode }>(`/api/nodes/${id}`)
  });
  const learners = useQuery({
    queryKey: ['learners', id],
    queryFn: () => api<LearnerProfile[]>(`/api/classrooms/${id}/learners`)
  });
  if (classroom.isLoading || learners.isLoading)
    return (
      <div className="page">
        <Loading />
      </div>
    );
  if (classroom.error || learners.error || !classroom.data)
    return (
      <div className="page">
        <ErrorState error={classroom.error ?? learners.error} />
      </div>
    );
  return (
    <div className="page">
      <PageHeader
        title={title(classroom.data.node)}
        subtitle="A jelvény és a szín játékos segítség, nem kizárólagos azonosító."
      />
      <div className="grid grid-3">
        {learners.data?.map((learner) => (
          <Link to={`/classes/${id}/learner/${learner.id}`} key={learner.id}>
            <Card>
              <div style={{ fontSize: 40 }}>{learner.badgeIcon}</div>
              <h2>{learner.nickname}</h2>
              <span className="badge-dot" style={{ background: learner.badgeColor }} />{' '}
              <span className="muted small">{learner.id}</span>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

type LearnerOverview = {
  learner: LearnerProfile;
  submissions: Submission[];
  evidence: Array<{ id: string; type: string; conceptIds: string[]; createdAt: string; value: unknown }>;
  conceptStates: Array<{ conceptId: string; state: string; confidence: number; explanation: string }>;
};

export function LearnerPage() {
  const { learnerId } = useParams();
  const query = useQuery({
    queryKey: ['learner-overview', learnerId],
    queryFn: () => api<LearnerOverview>(`/api/learners/${learnerId}/overview`)
  });
  if (query.isLoading)
    return (
      <div className="page">
        <Loading />
      </div>
    );
  if (query.error || !query.data)
    return (
      <div className="page">
        <ErrorState error={query.error} />
      </div>
    );
  const { learner, submissions, evidence, conceptStates } = query.data;
  return (
    <div className="page">
      <PageHeader
        title={`${learner.badgeIcon} ${learner.nickname}`}
        subtitle="Áttekintés bizonyítékokból, nem automatikus ítélet."
      />
      <div className="grid grid-2">
        <section className="panel">
          <h2>Fogalomállapotok</h2>
          {conceptStates.length ? (
            <div className="data-list">
              {conceptStates.map((state) => (
                <div className="data-row" key={state.conceptId}>
                  <div>
                    <strong>{state.conceptId}</strong>
                    <div className="muted small">{state.explanation}</div>
                  </div>
                  <Badge
                    color={
                      state.state === 'secure' ? 'green' : state.state === 'needs revision' ? 'red' : 'blue'
                    }
                  >
                    {state.state}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <Empty>Még nincs elég bizonyíték.</Empty>
          )}
        </section>
        <section className="panel">
          <h2>Próbálkozások és javítások</h2>
          <div className="data-list">
            {submissions.map((submission) => (
              <div className="status-line" key={submission.id}>
                <strong>{submission.exerciseId}</strong> · {submission.status}
                <div className="muted small">
                  pont: {submission.teacherScore ?? submission.automaticScore ?? 'kézi ellenőrzés'}/
                  {submission.maxScore} · próbálkozás {submission.attempt}
                </div>
                {submission.feedback ? <div>{submission.feedback}</div> : null}
              </div>
            ))}
          </div>
        </section>
      </div>
      <section className="panel" style={{ marginTop: 16 }}>
        <h2>Legutóbbi bizonyítékok</h2>
        <div className="data-list">
          {evidence.slice(0, 12).map((item) => (
            <div className="data-row" key={item.id}>
              <div>
                <strong>{item.type}</strong>
                <div className="muted small">{item.conceptIds.join(', ')}</div>
              </div>
              <span>{new Date(item.createdAt).toLocaleDateString('hu-HU')}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
