import { Badge, Button, Card, Dialog, TextField } from '@radix-ui/themes';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api, download } from '../api';
import { ErrorState, Loading } from '../components/AsyncState';
import { PageHeader } from '../components/PageHeader';

type Health = {
  application: { name: string; version: string; node: string };
  persistence: { mode: string; nodeCount: number };
  deployment: { assetProfile: string; maxPackageBytes: number; maxUploadBytes: number };
  modules: Array<{ id: string; version: string; title: string }>;
  capabilities: Array<{ id: string; title: string; state: string; description: string }>;
};
type StageResult = {
  validation: { valid: boolean; issues: Array<{ severity: string; code: string; message: string }> };
  summary: { additions: number; updates: number; relations: number };
  stagedPackage?: unknown;
};

export function AdminPage() {
  const client = useQueryClient();
  const health = useQuery({ queryKey: ['admin-health'], queryFn: () => api<Health>('/api/admin/health') });
  const reset = useMutation({
    mutationFn: () => api('/api/admin/demo/reset', { method: 'POST' }),
    onSuccess: () => client.invalidateQueries()
  });
  const [file, setFile] = useState<File | null>(null);
  const [stage, setStage] = useState<StageResult | null>(null);
  const stageMutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error('Válassz ZIP fájlt.');
      const data = new FormData();
      data.append('file', file);
      return api<StageResult>('/api/packages/stage', { method: 'POST', body: data });
    },
    onSuccess: setStage
  });
  const applyMutation = useMutation({
    mutationFn: () =>
      api('/api/packages/apply', { method: 'POST', body: JSON.stringify({ package: stage?.stagedPackage }) }),
    onSuccess: async () => {
      setStage(null);
      setFile(null);
      await client.invalidateQueries();
    }
  });
  const [conceptIds, setConceptIds] = useState('concept.pythagorean,concept.missing-leg');
  const [github, setGithub] = useState({ owner: '', repo: '', ref: 'main' });
  const githubQuery = useMutation({
    mutationFn: () =>
      api<{ packages: Array<{ path: string; manifest: unknown }> }>(
        `/api/github/source?owner=${encodeURIComponent(github.owner)}&repo=${encodeURIComponent(github.repo)}&ref=${encodeURIComponent(github.ref)}`
      )
  });
  if (health.isLoading)
    return (
      <div className="page">
        <Loading />
      </div>
    );
  if (health.error || !health.data)
    return (
      <div className="page">
        <ErrorState error={health.error} />
      </div>
    );
  return (
    <div className="page">
      <PageHeader
        title="Adminisztráció"
        subtitle="Képességek, telepítési korlátok, csomagok és biztonságos demonstrációs reset."
      />
      <div className="grid grid-3">
        <Card>
          <h2>Alkalmazás</h2>
          <div>
            {health.data.application.name} {health.data.application.version}
          </div>
          <div className="muted">{health.data.application.node}</div>
        </Card>
        <Card>
          <h2>Adattár</h2>
          <div>{health.data.persistence.mode}</div>
          <div>{health.data.persistence.nodeCount} csomópont</div>
        </Card>
        <Card>
          <h2>Eszközprofil</h2>
          <div>{health.data.deployment.assetProfile}</div>
          <div className="muted small">
            Csomaglimit: {Math.round(health.data.deployment.maxPackageBytes / 1024 / 1024)} MB
          </div>
        </Card>
      </div>
      <div className="grid grid-2" style={{ marginTop: 16 }}>
        <section className="panel">
          <h2>Képességkatalógus</h2>
          <div className="data-list">
            {health.data.capabilities.map((capability) => (
              <div className="data-row" key={capability.id}>
                <div>
                  <strong>{capability.title}</strong>
                  <div className="muted small">{capability.description}</div>
                </div>
                <Badge
                  color={
                    capability.state === 'stable'
                      ? 'green'
                      : capability.state === 'deferred'
                        ? 'gray'
                        : 'amber'
                  }
                >
                  {capability.state}
                </Badge>
              </div>
            ))}
          </div>
        </section>
        <section className="panel">
          <h2>Demó és export</h2>
          <div className="stack">
            <Dialog.Root>
              <Dialog.Trigger>
                <Button color="red" variant="soft">
                  Demó visszaállítása
                </Button>
              </Dialog.Trigger>
              <Dialog.Content>
                <Dialog.Title>Demó visszaállítása</Dialog.Title>
                <Dialog.Description>
                  A demonstrációs oktatási adatok visszaállnak az eredeti állapotra. A felhasználói fiók
                  megmarad.
                </Dialog.Description>
                <Button
                  color="red"
                  style={{ marginTop: 16 }}
                  onClick={() => reset.mutate()}
                  loading={reset.isPending}
                >
                  Visszaállítás megerősítése
                </Button>
              </Dialog.Content>
            </Dialog.Root>
            <Button
              variant="soft"
              onClick={() =>
                void download('/api/packages/export?packageId=fonat.demo.grade8', 'fonat-grade8-demo.zip')
              }
            >
              8. évfolyamos csomag exportja
            </Button>
            <label>
              AI feladatcsomag fogalmai
              <input
                className="input"
                value={conceptIds}
                onChange={(event) => setConceptIds(event.target.value)}
              />
            </label>
            <Button
              variant="soft"
              onClick={() =>
                void download(
                  `/api/ai-bundles/missing-exercises?conceptIds=${encodeURIComponent(conceptIds)}`,
                  'fonat-ai-task.zip'
                )
              }
            >
              AI feladatcsomag exportja
            </Button>
          </div>
        </section>
      </div>
      <div className="grid grid-2" style={{ marginTop: 16 }}>
        <section className="panel">
          <h2>Tartalomcsomag import</h2>
          <div className="stack">
            <input type="file" accept=".zip" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
            <Button onClick={() => stageMutation.mutate()} loading={stageMutation.isPending}>
              Csomag ellenőrzése
            </Button>
            {stageMutation.error ? <ErrorState error={stageMutation.error} /> : null}
            {stage ? (
              <div className={`finding ${stage.validation.valid ? 'suggestion' : 'error'}`}>
                <strong>{stage.validation.valid ? 'Érvényes csomag' : 'Hibás csomag'}</strong>
                <div>
                  {stage.summary.additions} új, {stage.summary.updates} frissítés, {stage.summary.relations}{' '}
                  kapcsolat
                </div>
                {stage.validation.issues.map((issue) => (
                  <div key={`${issue.code}-${issue.message}`}>
                    {issue.severity}: {issue.message}
                  </div>
                ))}
                {stage.validation.valid ? (
                  <Button
                    style={{ marginTop: 12 }}
                    onClick={() => applyMutation.mutate()}
                    loading={applyMutation.isPending}
                  >
                    Import megerősítése
                  </Button>
                ) : null}
              </div>
            ) : null}
          </div>
        </section>
        <section className="panel">
          <h2>Nyilvános GitHub tartalomforrás</h2>
          <div className="input-grid">
            <label>
              Tulajdonos
              <TextField.Root
                value={github.owner}
                onChange={(event) => setGithub({ ...github, owner: event.target.value })}
              />
            </label>
            <label>
              Repository
              <TextField.Root
                value={github.repo}
                onChange={(event) => setGithub({ ...github, repo: event.target.value })}
              />
            </label>
            <label>
              Branch vagy tag
              <TextField.Root
                value={github.ref}
                onChange={(event) => setGithub({ ...github, ref: event.target.value })}
              />
            </label>
            <Button onClick={() => githubQuery.mutate()} loading={githubQuery.isPending}>
              Érvényes csomagok keresése
            </Button>
            {githubQuery.error ? <ErrorState error={githubQuery.error} /> : null}
            {githubQuery.data ? <pre>{JSON.stringify(githubQuery.data.packages, null, 2)}</pre> : null}
          </div>
        </section>
      </div>
    </div>
  );
}
