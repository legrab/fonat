import type { GraphNode, LessonPayload } from '@fonat/contracts';
import { Badge, Button, Dialog, TextField } from '@radix-ui/themes';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { ErrorState, Loading } from '../components/AsyncState';
import { Markdown } from '../components/Markdown';
import { NodeRenderer, title } from '../components/NodeRenderer';

type LessonRun = {
  id: string;
  lessonId: string;
  startedAt: string;
  finishedAt?: string;
  currentSectionIndex: number;
  currentSlideIndex: number;
  status: 'running' | 'paused' | 'finished';
  sectionStartedAt: string;
  extraMinutes: number;
  completedSectionIds: string[];
  skippedSectionIds: string[];
  notes: Array<{ id: string; text: string; createdAt: string }>;
  updatedAt: string;
};
type Detail = { node: GraphNode; related: GraphNode[] };
type LiveSession = { id: string; code: string; joinUrl: string; status: string };

export function PresentationStartPage() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const mutation = useMutation({
    mutationFn: () =>
      api<LessonRun>('/api/lesson-runs', { method: 'POST', body: JSON.stringify({ lessonId }) }),
    onSuccess: (run) => navigate(`/presentation/${run.id}`)
  });
  useEffect(() => {
    if (!mutation.isPending && !mutation.isSuccess && !mutation.isError) mutation.mutate();
  }, [mutation]);
  return (
    <div className="student-shell">
      {mutation.error ? (
        <ErrorState error={mutation.error} />
      ) : (
        <Loading label="Bemutató mód előkészítése…" />
      )}
    </div>
  );
}

export function PresentationPage() {
  const { runId } = useParams();
  const [searchParams] = useSearchParams();
  const projected = searchParams.get('projected') === '1';
  const client = useQueryClient();
  const runQuery = useQuery({
    queryKey: ['lesson-run', runId],
    queryFn: () => api<LessonRun>(`/api/lesson-runs/${runId}`),
    refetchInterval: projected ? 3000 : 2500
  });
  const lessonQuery = useQuery({
    queryKey: ['presentation-lesson', runQuery.data?.lessonId],
    enabled: Boolean(runQuery.data?.lessonId),
    queryFn: () => api<Detail>(`/api/nodes/${runQuery.data!.lessonId}`)
  });
  const update = useMutation({
    mutationFn: (body: object) =>
      api<LessonRun>(`/api/lesson-runs/${runId}`, { method: 'PATCH', body: JSON.stringify(body) }),
    onSuccess: (run) => client.setQueryData(['lesson-run', runId], run)
  });
  const [note, setNote] = useState('');
  const [live, setLive] = useState<LiveSession | null>(null);
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const interval = window.setInterval(() => {
      if (runQuery.data?.status === 'running')
        setSeconds(
          Math.max(0, Math.floor((Date.now() - new Date(runQuery.data.sectionStartedAt).getTime()) / 1000))
        );
    }, 1000);
    return () => window.clearInterval(interval);
  }, [runQuery.data]);
  const lesson = lessonQuery.data?.node;
  const payload = lesson?.payload as LessonPayload | undefined;
  const run = runQuery.data;
  const section = run && payload ? payload.sections[run.currentSectionIndex] : undefined;
  const slide = section?.slides[run?.currentSlideIndex ?? 0];
  const related = useMemo(
    () => new Map(lessonQuery.data?.related.map((item) => [item.id, item]) ?? []),
    [lessonQuery.data]
  );
  const launchQuiz = useMutation({
    mutationFn: () => {
      const ids = section?.activityIds.filter((id) => related.get(id)?.type === 'exercise') ?? [];
      if (!ids.length) throw new Error('Ebben a szakaszban nincs élőben indítható feladat.');
      return api<LiveSession>('/api/live-sessions', {
        method: 'POST',
        body: JSON.stringify({
          lessonRunId: runId,
          exerciseIds: ids,
          mode: 'teacher-paced',
          allowGuest: true,
          leaderboard: false
        })
      });
    },
    onSuccess: async (session) => {
      setLive(session);
      await api(`/api/live-sessions/${session.code}`, {
        method: 'PATCH',
        body: JSON.stringify({ action: 'open' })
      });
    }
  });
  if (runQuery.isLoading || lessonQuery.isLoading)
    return (
      <div className="student-shell">
        <Loading />
      </div>
    );
  if (runQuery.error || lessonQuery.error || !run || !lesson || !payload || !section)
    return (
      <div className="student-shell">
        <ErrorState error={runQuery.error ?? lessonQuery.error ?? new Error('Az óra nem tölthető be.')} />
      </div>
    );
  const sectionMinutes = section.durationMinutes + run.extraMinutes;
  const remaining = Math.max(0, sectionMinutes * 60 - seconds);
  const renderSlide = () => {
    if (!slide)
      return (
        <div>
          <h1>{section.title}</h1>
          <p>{section.purpose}</p>
        </div>
      );
    if (slide.type === 'exercise' && slide.exerciseId) {
      const node = related.get(slide.exerciseId);
      return node ? <NodeRenderer node={node} /> : <p>Hiányzó feladat: {slide.exerciseId}</p>;
    }
    if (slide.type === 'image' && slide.resourceId) {
      const node = related.get(slide.resourceId);
      return node ? <NodeRenderer node={node} /> : null;
    }
    return (
      <div>
        <h1>{slide.title ?? section.title}</h1>
        <Markdown>{slide.content ?? ''}</Markdown>
      </div>
    );
  };
  return (
    <div className="presentation-root">
      <div className="presentation-toolbar">
        <div>
          <strong>{title(lesson)}</strong> <Badge>{section.title}</Badge>
        </div>
        <div>
          {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, '0')}
        </div>
      </div>
      <main className="presentation-stage">
        <div className="presentation-card">{renderSlide()}</div>
      </main>
      <footer className="presentation-footer">
        {projected ? (
          <>
            <span>
              {run.currentSectionIndex + 1}/{payload.sections.length}
            </span>
            <span>{run.status === 'paused' ? 'Szünet' : ''}</span>
          </>
        ) : (
          <>
            <div className="toolbar">
              <Button variant="soft" onClick={() => update.mutate({ action: 'previous' })}>
                Előző
              </Button>
              <Button onClick={() => update.mutate({ action: run.status === 'paused' ? 'resume' : 'pause' })}>
                {run.status === 'paused' ? 'Folytatás' : 'Szünet'}
              </Button>
              <Button variant="soft" onClick={() => update.mutate({ action: 'extend', minutes: 1 })}>
                +1 perc
              </Button>
              <Button onClick={() => update.mutate({ action: 'next' })}>Következő</Button>
            </div>
            <div className="toolbar">
              <Dialog.Root>
                <Dialog.Trigger>
                  <Button variant="soft">Jegyzet</Button>
                </Dialog.Trigger>
                <Dialog.Content>
                  <Dialog.Title>Futás közbeni megfigyelés</Dialog.Title>
                  <TextField.Root value={note} onChange={(event) => setNote(event.target.value)} />
                  <Button
                    style={{ marginTop: 12 }}
                    onClick={() => {
                      update.mutate({ action: 'note', note });
                      setNote('');
                    }}
                  >
                    Mentés
                  </Button>
                </Dialog.Content>
              </Dialog.Root>
              <Button variant="soft" onClick={() => launchQuiz.mutate()} loading={launchQuiz.isPending}>
                Élő kvíz
              </Button>
              <Button color="red" onClick={() => update.mutate({ action: 'finish' })}>
                Befejezés
              </Button>
            </div>
          </>
        )}
      </footer>
      {live ? (
        <div
          style={{
            position: 'fixed',
            right: 20,
            top: 70,
            background: 'white',
            color: 'black',
            padding: 16,
            borderRadius: 12,
            textAlign: 'center'
          }}
        >
          <QRCodeSVG value={live.joinUrl} size={160} />
          <div style={{ fontSize: 28, fontWeight: 700 }}>{live.code}</div>
          <a href={`/live/${live.code}`} target="_blank" rel="noreferrer">
            Tanári kvízvezérlő
          </a>
        </div>
      ) : null}
    </div>
  );
}
