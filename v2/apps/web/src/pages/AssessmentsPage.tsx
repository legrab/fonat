import type {
  AssessmentDelivery,
  Course,
  Finding,
  GraphNode,
  LearnerProfileV2,
  Page
} from '@fonat/contracts';
import { Badge, Button, Card, Checkbox, Dialog, Select, Table, Text, TextField } from '@radix-ui/themes';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';
import { Empty, ErrorState, Loading } from '../components/AsyncState';
import { PageHeader } from '../components/PageHeader';
import { title } from '../components/NodeRenderer';

type GenerateInput = {
  title: string;
  courseId: string;
  conceptIds: string[];
  questionCount: number;
  variants: number;
  allowReduced: boolean;
};

export function AssessmentsPage() {
  const client = useQueryClient();
  const [form, setForm] = useState<GenerateInput>({
    title: 'Új rövid ellenőrzés',
    courseId: '',
    conceptIds: [],
    questionCount: 6,
    variants: 2,
    allowReduced: true
  });
  const assessments = useQuery({
    queryKey: ['assessments'],
    queryFn: () => api<Page<GraphNode>>('/api/nodes?type=assessment&limit=30')
  });
  const courses = useQuery({
    queryKey: ['courses-v2'],
    queryFn: () => api<{ items: Course[] }>('/api/v2/courses')
  });
  const concepts = useQuery({
    queryKey: ['assessment-concepts'],
    queryFn: () => api<Page<GraphNode>>('/api/nodes?type=concept&limit=100')
  });
  const generate = useMutation({
    mutationFn: () =>
      api('/api/assessments/generate', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          allowAlternatives: true
        })
      }),
    onSuccess: () => client.invalidateQueries({ queryKey: ['assessments'] })
  });
  const toggleConcept = (id: string) =>
    setForm((current) => ({
      ...current,
      conceptIds: current.conceptIds.includes(id)
        ? current.conceptIds.filter((item) => item !== id)
        : [...current.conceptIds, id]
    }));

  return (
    <div className="page">
      <PageHeader
        title="Értékelések"
        subtitle="Blueprint-alapú kiválasztás, stabil tanulói kiosztások és megőrzött kérdéssnapshotok."
        actions={
          <Dialog.Root>
            <Dialog.Trigger>
              <Button>Értékelés generálása</Button>
            </Dialog.Trigger>
            <Dialog.Content maxWidth="720px">
              <Dialog.Title>Új értékelés</Dialog.Title>
              <div className="stack">
                <label>
                  Cím
                  <TextField.Root
                    value={form.title}
                    onChange={(event) => setForm({ ...form, title: event.target.value })}
                  />
                </label>
                <label>
                  Kurzus
                  <Select.Root
                    value={form.courseId}
                    onValueChange={(courseId) => setForm({ ...form, courseId })}
                  >
                    <Select.Trigger placeholder="Válassz kurzust" />
                    <Select.Content>
                      {courses.data?.items.map((course) => (
                        <Select.Item value={course.id} key={course.id}>
                          {course.name}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Root>
                </label>
                <fieldset className="panel">
                  <legend>Fogalmak</legend>
                  <div className="chip-list">
                    {concepts.data?.items.map((concept) => (
                      <label className="chip" key={concept.id}>
                        <Checkbox
                          checked={form.conceptIds.includes(concept.id)}
                          onCheckedChange={() => toggleConcept(concept.id)}
                        />{' '}
                        {title(concept)}
                      </label>
                    ))}
                  </div>
                </fieldset>
                <div className="input-grid">
                  <label>
                    Kérdések száma
                    <TextField.Root
                      type="number"
                      value={String(form.questionCount)}
                      onChange={(event) => setForm({ ...form, questionCount: Number(event.target.value) })}
                    />
                  </label>
                  <label>
                    Változatok
                    <TextField.Root
                      type="number"
                      value={String(form.variants)}
                      onChange={(event) => setForm({ ...form, variants: Number(event.target.value) })}
                    />
                  </label>
                </div>
                <label className="row">
                  <Checkbox
                    checked={form.allowReduced}
                    onCheckedChange={(checked) => setForm({ ...form, allowReduced: Boolean(checked) })}
                  />{' '}
                  Kisebb, hiányosan lefedő értékelés engedélyezése
                </label>
                {generate.error ? <ErrorState error={generate.error} /> : null}
                <Button
                  disabled={!form.courseId || !form.conceptIds.length}
                  loading={generate.isPending}
                  onClick={() => generate.mutate()}
                >
                  Generálás
                </Button>
              </div>
            </Dialog.Content>
          </Dialog.Root>
        }
      />
      {assessments.isLoading ? (
        <Loading />
      ) : assessments.error ? (
        <ErrorState error={assessments.error} />
      ) : assessments.data?.items.length ? (
        <div className="grid grid-2">
          {assessments.data.items.map((assessment) => (
            <Link to={`/assessments/${assessment.id}`} key={assessment.id}>
              <Card>
                <h2>{title(assessment)}</h2>
                <div className="row">
                  <Badge>{String(assessment.payload.kind ?? 'generated')}</Badge>
                  {assessment.payload.reduced ? <Badge color="amber">rövidített</Badge> : null}
                  <Badge color="gray">
                    {Object.values(
                      (assessment.payload.variants as Record<string, string[]> | undefined) ?? {}
                    )[0]?.length ?? 0}{' '}
                    kérdés
                  </Badge>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Empty>Nincs értékelés.</Empty>
      )}
    </div>
  );
}

type Analysis = {
  findings: Finding[];
  questionStats: Array<{
    exerciseId: string;
    attempts: number;
    average: number;
    omissions: number;
    optionCounts: Record<string, number>;
  }>;
  learnerStats: Array<{ learnerId: string; attempts: number; average: number }>;
};

export function AssessmentPage() {
  const { id } = useParams();
  const client = useQueryClient();
  const [learnerId, setLearnerId] = useState('');
  const detail = useQuery({
    queryKey: ['assessment', id],
    queryFn: () => api<{ node: GraphNode; related: GraphNode[] }>(`/api/nodes/${id}`)
  });
  const analysis = useQuery({
    queryKey: ['assessment-analysis', id],
    queryFn: () => api<Analysis>(`/api/assessments/${id}/analysis`)
  });
  const learners = useQuery({
    queryKey: ['learners-v2'],
    queryFn: () => api<{ items: LearnerProfileV2[] }>('/api/v2/learners-v2')
  });
  const deliveries = useQuery({
    queryKey: ['assessment-deliveries', id],
    enabled: Boolean(id),
    queryFn: () =>
      api<{ items: AssessmentDelivery[] }>(
        `/api/v2/assessment-deliveries?assessmentId=${encodeURIComponent(id!)}`
      )
  });
  const deliver = useMutation({
    mutationFn: () =>
      api<AssessmentDelivery>(`/api/v2/assessments/${id}/deliveries`, {
        method: 'POST',
        headers: { 'Idempotency-Key': crypto.randomUUID() },
        body: JSON.stringify({ learnerId })
      }),
    onSuccess: () => {
      setLearnerId('');
      void client.invalidateQueries({ queryKey: ['assessment-deliveries', id] });
    }
  });
  const learnerMap = useMemo(
    () => new Map(learners.data?.items.map((learner) => [learner.id, learner.nickname])),
    [learners.data]
  );
  if (detail.isLoading || analysis.isLoading)
    return (
      <div className="page">
        <Loading />
      </div>
    );
  if (detail.error || analysis.error || !detail.data || !analysis.data)
    return (
      <div className="page">
        <ErrorState error={detail.error ?? analysis.error} />
      </div>
    );
  const payload = detail.data.node.payload as Record<string, unknown>;
  const variants = (payload.variants as Record<string, string[]> | undefined) ?? {};
  return (
    <div className="page">
      <PageHeader
        title={title(detail.data.node)}
        subtitle="Az elemzők megfigyeléseket adnak, a tanulói kiosztások pedig pontos feladatrevíziókat őriznek."
        actions={
          <Button variant="soft" onClick={() => window.print()}>
            Nyomtatás / PDF
          </Button>
        }
      />
      <div className="grid grid-2">
        <section className="panel">
          <h2>Feladatsor</h2>
          {Object.keys(variants).length ? (
            Object.entries(variants).map(([variant, ids]) => (
              <div key={variant} className="stack">
                <h3>{variant} változat</h3>
                {ids.map((exerciseId, index) => (
                  <div className="data-row" key={`${variant}:${exerciseId}`}>
                    <span>
                      {index + 1}.{' '}
                      {detail.data.related.find((item) => item.id === exerciseId)?.title.values.hu ??
                        exerciseId}
                    </span>
                    <Badge>{exerciseId}</Badge>
                  </div>
                ))}
              </div>
            ))
          ) : (
            <pre>{JSON.stringify(payload, null, 2)}</pre>
          )}
          {Array.isArray(payload.deferredCoverage) && payload.deferredCoverage.length ? (
            <div className="finding warning">
              <strong>Halasztott lefedettség</strong>
              <div>{payload.deferredCoverage.join(', ')}</div>
            </div>
          ) : null}
        </section>
        <section className="panel">
          <h2>Tanulói kiosztás</h2>
          <div className="row">
            <Select.Root value={learnerId} onValueChange={setLearnerId}>
              <Select.Trigger placeholder="Válassz tanulót" />
              <Select.Content>
                {learners.data?.items.map((learner) => (
                  <Select.Item key={learner.id} value={learner.id}>
                    {learner.nickname}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
            <Button disabled={!learnerId} loading={deliver.isPending} onClick={() => deliver.mutate()}>
              Kiosztás
            </Button>
          </div>
          {deliver.error ? <ErrorState error={deliver.error} /> : null}
          <Table.Root>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeaderCell>Tanuló</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Változat</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Állapot</Table.ColumnHeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {deliveries.data?.items.map((delivery) => (
                <Table.Row key={delivery.id}>
                  <Table.Cell>{learnerMap.get(delivery.learnerId) ?? delivery.learnerId}</Table.Cell>
                  <Table.Cell>{delivery.variantKey}</Table.Cell>
                  <Table.Cell>
                    <Badge>{delivery.status}</Badge>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </section>
      </div>
      <div className="grid grid-2" style={{ marginTop: 16 }}>
        <section className="panel">
          <h2>Elemzési megállapítások</h2>
          {analysis.data.findings.length ? (
            <div className="stack">
              {analysis.data.findings.map((finding) => (
                <div className={`finding ${finding.severity}`} key={finding.id}>
                  <strong>{finding.title}</strong>
                  <div>{finding.message}</div>
                </div>
              ))}
            </div>
          ) : (
            <Empty>Még nincs értékelhető eredmény.</Empty>
          )}
        </section>
        <section className="panel">
          <h2>Kérdésstatisztikák</h2>
          {analysis.data.questionStats.length ? (
            <div className="data-list">
              {analysis.data.questionStats.map((stat) => (
                <div className="data-row" key={stat.exerciseId}>
                  <div>
                    <strong>
                      {detail.data.related.find((item) => item.id === stat.exerciseId)?.title.values.hu ??
                        stat.exerciseId}
                    </strong>
                    <div className="muted small">
                      {stat.attempts} próbálkozás · {stat.omissions} kihagyás
                    </div>
                  </div>
                  <Badge color={stat.average >= 0.75 ? 'green' : stat.average < 0.5 ? 'red' : 'amber'}>
                    {(stat.average * 100).toFixed(0)}%
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <Text color="gray">Még nincs kérdésstatisztika.</Text>
          )}
        </section>
      </div>
    </div>
  );
}
