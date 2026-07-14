import type { GraphNode, ProjectPayload } from '@fonat/contracts';
import { Badge, Button, Callout, Card, Dialog, TextField } from '@radix-ui/themes';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { api, ApiError } from '../../api';
import { PageHeader } from '../../components/PageHeader';

function projectPayload(node: GraphNode): ProjectPayload {
  return node.payload as ProjectPayload;
}

function ProjectEditor({ project }: { project?: GraphNode }) {
  const client = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('Új tanulói projekt');
  const [summary, setSummary] = useState('Elkülönített, továbbfejleszthető projektváz.');
  const [preparationNotes, setPreparationNotes] = useState('');
  const [opportunity, setOpportunity] = useState('Adj hozzá egy új logikai kihívást.');

  useEffect(() => {
    if (!project) return;
    const payload = projectPayload(project);
    setTitle(project.title.values.hu ?? project.title.values.en ?? project.id);
    setSummary(project.summary?.values.hu ?? project.summary?.values.en ?? '');
    setPreparationNotes(payload.preparationNotes);
    setOpportunity(payload.contributorOpportunities[0] ?? '');
  }, [project]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!project)
        return api<GraphNode>('/api/v2/projects', {
          method: 'POST',
          body: JSON.stringify({
            title,
            summary,
            payload: {
              subjectIds: [],
              courseIds: [],
              learnerGroupIds: [],
              conceptIds: [],
              curriculumRequirementIds: [],
              resourceIds: [],
              activityTemplateIds: [],
              assignmentIds: [],
              expectedOutputs: [],
              equipment: [],
              preparationNotes,
              characters: [],
              challengeSequence: [],
              contributorOpportunities: opportunity ? [opportunity] : []
            }
          })
        });
      const payload = projectPayload(project);
      return api<GraphNode>(`/api/nodes/${project.id}`, {
        method: 'PUT',
        headers: { 'If-Match': String(project.version) },
        body: JSON.stringify({
          ...project,
          title: { ...project.title, values: { ...project.title.values, hu: title } },
          summary: { canonicalLanguage: 'hu', values: { hu: summary } },
          payload: {
            ...payload,
            preparationNotes,
            contributorOpportunities: opportunity
              ? [opportunity, ...payload.contributorOpportunities.slice(1)]
              : payload.contributorOpportunities.slice(1)
          }
        })
      });
    },
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['projects'] });
      setOpen(false);
    }
  });

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger>
        <Button variant={project ? 'soft' : 'solid'}>
          {project ? 'Projekt szerkesztése' : 'Új projektváz'}
        </Button>
      </Dialog.Trigger>
      <Dialog.Content maxWidth="640px">
        <Dialog.Title>{project ? 'Projekt szerkesztése' : 'Projekt létrehozása'}</Dialog.Title>
        <Dialog.Description>
          A projektképesség elkülönített alapja. A rendes tanórai munkafolyamatok nem függnek tőle.
        </Dialog.Description>
        <div className="stack" style={{ marginTop: 16 }}>
          <label>
            Cím
            <TextField.Root value={title} onChange={(event) => setTitle(event.target.value)} />
          </label>
          <label>
            Rövid leírás
            <textarea rows={3} value={summary} onChange={(event) => setSummary(event.target.value)} />
          </label>
          <label>
            Előkészítési jegyzet
            <textarea
              rows={4}
              value={preparationNotes}
              onChange={(event) => setPreparationNotes(event.target.value)}
            />
          </label>
          <label>
            Első hozzájárulási lehetőség
            <TextField.Root value={opportunity} onChange={(event) => setOpportunity(event.target.value)} />
          </label>
          {mutation.error && (
            <Callout.Root color="red">
              <Callout.Text>{mutation.error.message}</Callout.Text>
            </Callout.Root>
          )}
          <div className="row">
            <Button disabled={!title.trim() || mutation.isPending} onClick={() => mutation.mutate()}>
              {mutation.isPending ? 'Mentés…' : 'Mentés'}
            </Button>
            <Dialog.Close>
              <Button variant="soft" color="gray">
                Mégse
              </Button>
            </Dialog.Close>
          </div>
        </div>
      </Dialog.Content>
    </Dialog.Root>
  );
}

export function ProjectsPage() {
  const projects = useQuery({
    queryKey: ['projects'],
    queryFn: () => api<{ items: GraphNode[] }>('/api/v2/projects'),
    retry: false
  });
  const unsupported =
    projects.error instanceof ApiError && projects.error.result.error.code === 'unsupported_capability';
  return (
    <div className="page">
      <PageHeader
        title="Projektek"
        subtitle="Elkülönített kísérleti terület összetett, tantárgyakon átívelő munkákhoz."
        actions={!unsupported ? <ProjectEditor /> : undefined}
      />
      {unsupported ? (
        <Callout.Root color="orange">
          <Callout.Text>
            A Project capability ebben a profilban ki van kapcsolva. Az adatok változatlanul megmaradnak.
          </Callout.Text>
        </Callout.Root>
      ) : projects.error ? (
        <Callout.Root color="red">
          <Callout.Text>{projects.error.message}</Callout.Text>
        </Callout.Root>
      ) : (
        <div className="grid grid-2">
          {projects.data?.items.map((project) => {
            const payload = projectPayload(project);
            return (
              <Card key={project.id} className="stack">
                <div className="row spread">
                  <div>
                    <h3>{project.title.values.hu ?? project.title.values.en ?? project.id}</h3>
                    <p>{project.summary?.values.hu ?? project.summary?.values.en}</p>
                  </div>
                  <ProjectEditor project={project} />
                </div>

                {payload.characters.length > 0 && (
                  <section>
                    <h4>Szereplők</h4>
                    <div className="row wrap">
                      {payload.characters.map((character) => (
                        <Badge key={character.id} color="blue" variant="soft">
                          {character.name}, {character.species}: {character.strength}
                        </Badge>
                      ))}
                    </div>
                  </section>
                )}

                {payload.challengeSequence.length > 0 && (
                  <section>
                    <h4>Kihívások</h4>
                    <ol className="stack compact">
                      {payload.challengeSequence.map((challenge) => (
                        <li key={challenge.id}>
                          <strong>{challenge.title}</strong>{' '}
                          <Badge color={challenge.status === 'ready' ? 'green' : 'orange'}>
                            {challenge.status === 'ready'
                              ? 'kész'
                              : challenge.status === 'draft'
                                ? 'vázlat'
                                : 'terv'}
                          </Badge>
                          <div className="muted">{challenge.summary}</div>
                        </li>
                      ))}
                    </ol>
                  </section>
                )}

                {payload.contributorOpportunities.length > 0 && (
                  <Callout.Root color="orange" variant="surface">
                    <Callout.Text>
                      <strong>Fejlesztési lehetőségek:</strong> {payload.contributorOpportunities.join(' ')}
                    </Callout.Text>
                  </Callout.Root>
                )}

                <small className="muted">
                  {project.lifecycle} · {project.currentRevision}. revízió · elkülönített capability
                </small>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
