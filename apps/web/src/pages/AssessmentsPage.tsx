import type { Finding, GraphNode, Page } from '@fonat/contracts';
import { Badge, Button, Card, Dialog } from '@radix-ui/themes';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';
import { Empty, ErrorState, Loading } from '../components/AsyncState';
import { PageHeader } from '../components/PageHeader';
import { title } from '../components/NodeRenderer';

type GenerateForm = {
  title: string;
  classroomId: string;
  conceptIds: string;
  questionCount: number;
  variants: number;
  allowReduced: boolean;
};

export function AssessmentsPage() {
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ['assessments'],
    queryFn: () => api<Page<GraphNode>>('/api/nodes?type=assessment&limit=100')
  });
  const form = useForm<GenerateForm>({
    defaultValues: {
      title: 'Új rövid ellenőrzés',
      classroomId: 'classroom.grade8.demo',
      conceptIds: 'concept.pythagorean,concept.missing-hypotenuse,concept.missing-leg',
      questionCount: 6,
      variants: 2,
      allowReduced: true
    }
  });
  const generate = useMutation({
    mutationFn: (values: GenerateForm) =>
      api('/api/assessments/generate', {
        method: 'POST',
        body: JSON.stringify({
          ...values,
          conceptIds: values.conceptIds
            .split(',')
            .map((value) => value.trim())
            .filter(Boolean),
          allowAlternatives: true
        })
      }),
    onSuccess: () => client.invalidateQueries({ queryKey: ['assessments'] })
  });
  return (
    <div className="page">
      <PageHeader
        title="Értékelések"
        subtitle="Átlátható forrásválasztás, A/B változatok, kisebb értékelés és halasztott lefedettség."
        actions={
          <Dialog.Root>
            <Dialog.Trigger>
              <Button>Értékelés generálása</Button>
            </Dialog.Trigger>
            <Dialog.Content>
              <Dialog.Title>Új értékelés</Dialog.Title>
              <form className="input-grid" onSubmit={form.handleSubmit((values) => generate.mutate(values))}>
                <label>
                  Cím
                  <input className="input" {...form.register('title')} />
                </label>
                <label>
                  Osztályazonosító
                  <input className="input" {...form.register('classroomId')} />
                </label>
                <label>
                  Fogalmak, vesszővel
                  <input className="input" {...form.register('conceptIds')} />
                </label>
                <label>
                  Kérdések száma
                  <input
                    className="input"
                    type="number"
                    {...form.register('questionCount', { valueAsNumber: true })}
                  />
                </label>
                <label>
                  Változatok
                  <input
                    className="input"
                    type="number"
                    {...form.register('variants', { valueAsNumber: true })}
                  />
                </label>
                <label className="row">
                  <input type="checkbox" {...form.register('allowReduced')} /> Kisebb értékelés engedélyezése
                </label>
                {generate.error ? <ErrorState error={generate.error} /> : null}
                <Button type="submit" loading={generate.isPending}>
                  Generálás
                </Button>
              </form>
            </Dialog.Content>
          </Dialog.Root>
        }
      />
      {query.isLoading ? (
        <Loading />
      ) : query.error ? (
        <ErrorState error={query.error} />
      ) : query.data?.items.length ? (
        <div className="grid grid-2">
          {query.data.items.map((assessment) => (
            <Link to={`/assessments/${assessment.id}`} key={assessment.id}>
              <Card>
                <h2>{title(assessment)}</h2>
                <div className="row">
                  <Badge>{String(assessment.payload.kind ?? 'generated')}</Badge>
                  {assessment.payload.reduced ? <Badge color="amber">rövidített</Badge> : null}
                  <Badge color="gray">
                    {String(
                      (assessment.payload.exerciseIds as string[] | undefined)?.length ??
                        Object.values(
                          (assessment.payload.variants as Record<string, string[]> | undefined) ?? {}
                        )[0]?.length ??
                        0
                    )}{' '}
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
  const detail = useQuery({
    queryKey: ['assessment', id],
    queryFn: () => api<{ node: GraphNode; related: GraphNode[] }>(`/api/nodes/${id}`)
  });
  const analysis = useQuery({
    queryKey: ['assessment-analysis', id],
    queryFn: () => api<Analysis>(`/api/assessments/${id}/analysis`)
  });
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
        subtitle="Az elemzők megfigyeléseket adnak, nem írják át az eredményeket."
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
                  <div className="data-row" key={exerciseId}>
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
      </div>
      <section className="panel" style={{ marginTop: 16 }}>
        <h2>Kérdésstatisztikák</h2>
        <div className="data-list">
          {analysis.data.questionStats.map((stat) => (
            <div className="data-row" key={stat.exerciseId}>
              <div>
                <strong>{stat.exerciseId}</strong>
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
      </section>
    </div>
  );
}
