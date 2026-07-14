import type { ExercisePayload, GraphNode } from '@fonat/contracts';
import { Badge, Button, Card, Heading, Tabs, Text } from '@radix-ui/themes';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import { api } from '../api';
import { ErrorState, Loading } from '../components/AsyncState';
import { Markdown } from '../components/Markdown';

type Participant = {
  id: string;
  learnerId?: string;
  nickname: string;
  badgeIcon: string;
  badgeColor: string;
  claimCode?: string;
};
type JoinResult = { participant: Participant; session: { code: string; status: string; mode: string } };
type Poll = {
  session: {
    id: string;
    code: string;
    status: string;
    mode: string;
    currentIndex: number;
    total: number;
    participantCount: number;
  };
  exercise: GraphNode | null;
  answerCount: number;
  distribution?: Record<string, number>;
};

export function StudentJoinPage() {
  const { code } = useParams();
  const storageKey = `fonat.participant.${code}`;
  const [participant, setParticipant] = useState<Participant | null>(() => {
    const raw = localStorage.getItem(storageKey);
    return raw ? (JSON.parse(raw) as Participant) : null;
  });
  const [selected, setSelected] = useState<string[]>([]);
  const [answer, setAnswer] = useState('');
  const [confidence, setConfidence] = useState(3);
  const [lastQuestion, setLastQuestion] = useState<string | null>(null);
  const accessForm = useForm<{ classroomCode: string; learnerId: string; secret: string }>({
    defaultValues: { classroomCode: code === '843921' ? 'FONAT8' : '', learnerId: '', secret: '' }
  });
  const joinGuest = useMutation({
    mutationFn: () =>
      api<JoinResult>(`/api/live-sessions/${code}/join`, {
        method: 'POST',
        body: JSON.stringify({ guest: true })
      }),
    onSuccess: (value) => {
      setParticipant(value.participant);
      localStorage.setItem(storageKey, JSON.stringify(value.participant));
    }
  });
  const joinLearner = useMutation({
    mutationFn: (values: { classroomCode: string; learnerId: string; secret: string }) =>
      api<JoinResult>(`/api/live-sessions/${code}/join`, { method: 'POST', body: JSON.stringify(values) }),
    onSuccess: (value) => {
      setParticipant(value.participant);
      localStorage.setItem(storageKey, JSON.stringify(value.participant));
    }
  });
  const poll = useQuery({
    queryKey: ['student-poll', code],
    enabled: Boolean(participant),
    queryFn: () => api<Poll>(`/api/live-sessions/${code}/poll`),
    refetchInterval: (query) =>
      query.state.data?.session.status === 'closed' ? 12_000 : document.hidden ? 10_000 : 5000
  });
  const exercisePayload = poll.data?.exercise?.payload as ExercisePayload | undefined;
  useEffect(() => {
    const id = poll.data?.exercise?.id ?? null;
    if (id !== lastQuestion) {
      setLastQuestion(id);
      setSelected([]);
      setAnswer('');
      setConfidence(3);
    }
  }, [poll.data?.exercise?.id, lastQuestion]);
  const submit = useMutation({
    mutationFn: () => {
      if (!participant || !poll.data?.exercise) throw new Error('Nincs aktív kérdés.');
      const response =
        exercisePayload?.exerciseType === 'multi-select'
          ? selected
          : ['single-choice', 'true-false'].includes(exercisePayload?.exerciseType ?? '')
            ? selected[0]
            : answer;
      return api(`/api/live-sessions/${code}/answer`, {
        method: 'POST',
        body: JSON.stringify({ participantId: participant.id, answer: response, evidence: { confidence } })
      });
    }
  });
  const options = useMemo(() => exercisePayload?.options ?? [], [exercisePayload]);
  if (!participant)
    return (
      <div className="student-shell">
        <Card className="student-card">
          <div className="stack">
            <Heading>Csatlakozás</Heading>
            <Text color="gray">Munkamenet: {code}</Text>
            <Tabs.Root defaultValue="guest">
              <Tabs.List>
                <Tabs.Trigger value="guest">Vendég</Tabs.Trigger>
                <Tabs.Trigger value="learner">Tanulói kód</Tabs.Trigger>
              </Tabs.List>
              <Tabs.Content value="guest">
                <div className="stack">
                  <Text>
                    Gyors próba személyes adatok nélkül. Egy egyedi becenevet kapsz erre a munkamenetre.
                  </Text>
                  {joinGuest.error ? <ErrorState error={joinGuest.error} /> : null}
                  <Button onClick={() => joinGuest.mutate()} loading={joinGuest.isPending}>
                    Becenév kérése
                  </Button>
                </div>
              </Tabs.Content>
              <Tabs.Content value="learner">
                <form
                  className="input-grid"
                  onSubmit={accessForm.handleSubmit((values) => joinLearner.mutate(values))}
                >
                  <label>
                    Osztálykód
                    <input className="input" {...accessForm.register('classroomCode', { required: true })} />
                  </label>
                  <label>
                    Tanulói azonosító
                    <input
                      className="input"
                      {...accessForm.register('learnerId', { required: true })}
                      placeholder="learner.red-panda"
                    />
                  </label>
                  <label>
                    Személyes kód
                    <input
                      className="input"
                      type="password"
                      {...accessForm.register('secret', { required: true })}
                      placeholder="demo1"
                    />
                  </label>
                  {joinLearner.error ? <ErrorState error={joinLearner.error} /> : null}
                  <Button type="submit" loading={joinLearner.isPending}>
                    Csatlakozás
                  </Button>
                </form>
              </Tabs.Content>
            </Tabs.Root>
          </div>
        </Card>
      </div>
    );
  if (poll.isLoading)
    return (
      <div className="student-shell">
        <Loading />
      </div>
    );
  if (poll.error || !poll.data)
    return (
      <div className="student-shell">
        <ErrorState error={poll.error} />
      </div>
    );
  return (
    <div className="student-shell">
      <Card className="student-card">
        <div className="stack">
          <div className="row-between">
            <div className="row">
              <span style={{ fontSize: 30 }}>{participant.badgeIcon}</span>
              <strong>{participant.nickname}</strong>
            </div>
            <Badge>
              {poll.data.session.currentIndex + 1}/{poll.data.session.total}
            </Badge>
          </div>
          {poll.data.session.status === 'lobby' ? (
            <div className="empty">A tanár még nem nyitotta meg a kérdést.</div>
          ) : poll.data.session.status === 'closed' ? (
            <div className="status-line success">A munkamenet lezárult. Köszönjük a részvételt.</div>
          ) : poll.data.exercise && exercisePayload ? (
            <>
              <Markdown>{exercisePayload.prompt.values.hu ?? ''}</Markdown>
              {options.length ? (
                <div className="stack">
                  {options.map((option) => {
                    const active = selected.includes(option.id);
                    return (
                      <button
                        key={option.id}
                        className={`option-button${active ? ' selected' : ''}`}
                        onClick={() =>
                          setSelected((current) =>
                            exercisePayload.exerciseType === 'multi-select'
                              ? active
                                ? current.filter((item) => item !== option.id)
                                : [...current, option.id]
                              : [option.id]
                          )
                        }
                      >
                        {option.text.values.hu}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <input
                  className="input"
                  inputMode={exercisePayload.exerciseType === 'numeric' ? 'decimal' : 'text'}
                  value={answer}
                  onChange={(event) => setAnswer(event.target.value)}
                  placeholder="Válasz"
                />
              )}
              <label>
                Magabiztosság: {confidence}/5
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={confidence}
                  onChange={(event) => setConfidence(Number(event.target.value))}
                />
              </label>
              {submit.error ? <ErrorState error={submit.error} /> : null}
              <Button onClick={() => submit.mutate()} loading={submit.isPending} disabled={submit.isSuccess}>
                {submit.isSuccess ? 'Beküldve' : 'Válasz küldése'}
              </Button>
              {poll.data.session.status === 'revealed' && poll.data.distribution ? (
                <pre>{JSON.stringify(poll.data.distribution, null, 2)}</pre>
              ) : null}
            </>
          ) : (
            <div className="empty">Nincs aktív kérdés.</div>
          )}
          {participant.claimCode ? (
            <Text size="1" color="gray">
              Vendég-igénylőkód: {participant.claimCode}
            </Text>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
