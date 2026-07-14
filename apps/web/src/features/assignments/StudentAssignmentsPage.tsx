import { useEffect, useMemo, useState } from 'react';
import { Badge, Button, Card, Checkbox, Heading, RadioGroup, Text, TextField } from '@radix-ui/themes';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  AnswerDraft,
  AssessmentDelivery,
  Assignment,
  ExercisePayload,
  LocalizedText
} from '@fonat/contracts';
import { api } from '../../api';
import { ErrorState, Loading } from '../../components/AsyncState';
import { Markdown } from '../../components/Markdown';

type Access = { token: string; learnerId: string; expiresAt: string };
type AssignmentView = {
  assignment: Assignment;
  learnerId: string;
  exercises: Array<{ id: string; revision: number; title: LocalizedText; payload: ExercisePayload }>;
};

function withStudentToken(token: string, init?: RequestInit): RequestInit {
  return { ...init, headers: { Authorization: `Bearer ${token}`, ...init?.headers } };
}

function snapshotTitle(snapshot: Record<string, unknown>): string {
  const localized = snapshot.title as { values?: Record<string, string> } | undefined;
  return localized?.values?.hu ?? localized?.values?.en ?? 'Értékelési kérdés';
}

function QuestionAnswer({
  delivery,
  answers,
  setAnswers
}: {
  delivery: AssessmentDelivery;
  answers: Record<string, unknown>;
  setAnswers: React.Dispatch<React.SetStateAction<Record<string, unknown>>>;
}) {
  return (
    <div className="stack">
      {delivery.questions.map((question, index) => {
        const payload = question.snapshot.payload as ExercisePayload;
        const options = new Map(payload.options?.map((option) => [option.id, option]) ?? []);
        const ordered = question.optionOrder.length
          ? question.optionOrder.map((id) => options.get(id)).filter(Boolean)
          : payload.options;
        const value = answers[question.exerciseId];
        return (
          <section className="panel" key={`${question.slotId}:${question.exerciseId}`}>
            <div className="row-between">
              <strong>
                {index + 1}. {snapshotTitle(question.snapshot)}
              </strong>
              <Badge>{question.revision}. rev.</Badge>
            </div>
            <Markdown>{payload.prompt.values.hu ?? payload.prompt.values.en ?? ''}</Markdown>
            {payload.exerciseType === 'single-choice' || payload.exerciseType === 'boolean' ? (
              <RadioGroup.Root
                value={String(value ?? '')}
                onValueChange={(next) =>
                  setAnswers((current) => ({ ...current, [question.exerciseId]: next }))
                }
              >
                {ordered.map((option) =>
                  option ? (
                    <RadioGroup.Item value={option.id} key={option.id}>
                      {option.text.values.hu ?? option.text.values.en ?? option.id}
                    </RadioGroup.Item>
                  ) : null
                )}
              </RadioGroup.Root>
            ) : payload.exerciseType === 'multi-select' ? (
              <div className="stack">
                {ordered.map((option) => {
                  if (!option) return null;
                  const selected = Array.isArray(value) && value.includes(option.id);
                  return (
                    <label className="row" key={option.id}>
                      <Checkbox
                        checked={selected}
                        onCheckedChange={(checked) =>
                          setAnswers((current) => {
                            const before = Array.isArray(current[question.exerciseId])
                              ? (current[question.exerciseId] as string[])
                              : [];
                            return {
                              ...current,
                              [question.exerciseId]: checked
                                ? [...new Set([...before, option.id])]
                                : before.filter((id) => id !== option.id)
                            };
                          })
                        }
                      />{' '}
                      {option.text.values.hu ?? option.text.values.en ?? option.id}
                    </label>
                  );
                })}
              </div>
            ) : (
              <TextField.Root
                value={String(value ?? '')}
                onChange={(event) =>
                  setAnswers((current) => ({ ...current, [question.exerciseId]: event.target.value }))
                }
                placeholder="Válasz"
              />
            )}
          </section>
        );
      })}
    </div>
  );
}

export function StudentAssignmentsPage() {
  const queryClient = useQueryClient();
  const [access, setAccess] = useState<Access | null>(() => {
    const raw = localStorage.getItem('fonat.student-access');
    return raw ? (JSON.parse(raw) as Access) : null;
  });
  const [classroomCode, setClassroomCode] = useState('FONAT8');
  const [learnerId, setLearnerId] = useState('learner.fox');
  const [secret, setSecret] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [assessmentAnswers, setAssessmentAnswers] = useState<Record<string, unknown>>({});
  const [draftVersion, setDraftVersion] = useState(0);

  const login = useMutation({
    mutationFn: () =>
      api<Access>('/api/v2/student/access', {
        method: 'POST',
        body: JSON.stringify({ classroomCode, learnerId, secret })
      }),
    onSuccess: (value) => {
      localStorage.setItem('fonat.student-access', JSON.stringify(value));
      setAccess(value);
    }
  });
  const assignments = useQuery({
    queryKey: ['student-assignments', access?.learnerId],
    enabled: Boolean(access),
    retry: false,
    queryFn: () =>
      api<{ items: Assignment[] }>('/api/v2/student/assignments', withStudentToken(access!.token))
  });
  const deliveries = useQuery({
    queryKey: ['student-assessment-deliveries', access?.learnerId],
    enabled: Boolean(access),
    retry: false,
    queryFn: () =>
      api<{ items: AssessmentDelivery[] }>('/api/v2/assessment-deliveries', withStudentToken(access!.token))
  });
  const selectedDelivery = deliveries.data?.items.find((item) => item.id === selectedDeliveryId);
  const detail = useQuery({
    queryKey: ['student-assignment', selectedId, access?.learnerId],
    enabled: Boolean(access && selectedId),
    queryFn: () =>
      api<AssignmentView>(`/api/v2/student/assignments/${selectedId}`, withStudentToken(access!.token))
  });
  const draft = useQuery({
    queryKey: ['student-draft', selectedId, access?.learnerId],
    enabled: Boolean(access && selectedId),
    retry: false,
    queryFn: () =>
      api<AnswerDraft>(
        `/api/v2/assignments/${selectedId}/drafts/${access!.learnerId}`,
        withStudentToken(access!.token)
      )
  });
  useEffect(() => {
    if (!draft.data) return;
    setAnswers(draft.data.answers);
    setDraftVersion(draft.data.version);
  }, [draft.data]);
  const saveDraft = useMutation({
    mutationFn: () =>
      api<AnswerDraft>(
        `/api/v2/assignments/${selectedId}/drafts/${access!.learnerId}`,
        withStudentToken(access!.token, {
          method: 'PUT',
          headers: { 'Idempotency-Key': crypto.randomUUID(), 'If-Match': String(draftVersion) },
          body: JSON.stringify({ answers, version: draftVersion })
        })
      ),
    onSuccess: (value) => {
      setDraftVersion(value.version);
      queryClient.setQueryData(['student-draft', selectedId, access?.learnerId], value);
    }
  });
  const submit = useMutation({
    mutationFn: () =>
      api(
        `/api/v2/assignments/${selectedId}/submit/${access!.learnerId}`,
        withStudentToken(access!.token, {
          method: 'POST',
          headers: { 'Idempotency-Key': crypto.randomUUID() },
          body: JSON.stringify({ answers })
        })
      ),
    onSuccess: () => {
      setAnswers({});
      setSelectedId(null);
      void assignments.refetch();
    }
  });
  const submitAssessment = useMutation({
    mutationFn: () =>
      api(
        `/api/v2/assessment-deliveries/${selectedDeliveryId}/submit`,
        withStudentToken(access!.token, {
          method: 'POST',
          headers: { 'Idempotency-Key': crypto.randomUUID() },
          body: JSON.stringify({ answers: assessmentAnswers })
        })
      ),
    onSuccess: () => {
      setAssessmentAnswers({});
      setSelectedDeliveryId(null);
      void deliveries.refetch();
    }
  });
  const assignmentTitle = useMemo(() => detail.data?.assignment.title ?? '', [detail.data]);

  if (!access)
    return (
      <div className="student-shell">
        <Card className="student-card">
          <div className="stack">
            <Heading>Fonat feladatok</Heading>
            <Text color="gray">Lépj be az osztály- és személyes kódoddal.</Text>
            <label>
              Osztálykód
              <TextField.Root
                value={classroomCode}
                onChange={(event) => setClassroomCode(event.target.value)}
              />
            </label>
            <label>
              Tanulói azonosító
              <TextField.Root value={learnerId} onChange={(event) => setLearnerId(event.target.value)} />
            </label>
            <label>
              Személyes kód
              <TextField.Root
                type="password"
                value={secret}
                onChange={(event) => setSecret(event.target.value)}
              />
            </label>
            {login.error ? <ErrorState error={login.error} /> : null}
            <Button onClick={() => login.mutate()} loading={login.isPending}>
              Belépés
            </Button>
          </div>
        </Card>
      </div>
    );

  if (selectedDelivery)
    return (
      <div className="student-shell">
        <Card className="student-card">
          <div className="stack">
            <div className="row-between">
              <Heading size="5">Online értékelés</Heading>
              <Button variant="ghost" onClick={() => setSelectedDeliveryId(null)}>
                Vissza
              </Button>
            </div>
            <div className="row">
              <Badge>{selectedDelivery.variantKey} változat</Badge>
              <Badge>{selectedDelivery.status}</Badge>
            </div>
            <QuestionAnswer
              delivery={selectedDelivery}
              answers={assessmentAnswers}
              setAnswers={setAssessmentAnswers}
            />
            {submitAssessment.error ? <ErrorState error={submitAssessment.error} /> : null}
            <Button
              disabled={selectedDelivery.status === 'submitted'}
              loading={submitAssessment.isPending}
              onClick={() => submitAssessment.mutate()}
            >
              Értékelés beadása
            </Button>
          </div>
        </Card>
      </div>
    );

  if (selectedId)
    return (
      <div className="student-shell">
        <Card className="student-card">
          <div className="stack">
            <div className="row-between">
              <Heading size="5">{assignmentTitle || 'Feladat'}</Heading>
              <Button variant="ghost" onClick={() => setSelectedId(null)}>
                Vissza
              </Button>
            </div>
            {detail.isLoading || draft.isLoading ? (
              <Loading />
            ) : detail.error ? (
              <ErrorState error={detail.error} />
            ) : (
              detail.data?.exercises.map((exercise) => (
                <section key={exercise.id} className="panel">
                  <div className="row-between">
                    <strong>{exercise.title.values.hu ?? exercise.id}</strong>
                    <Badge>{exercise.revision}. rev.</Badge>
                  </div>
                  <Markdown>{exercise.payload.prompt.values.hu ?? ''}</Markdown>
                  <TextField.Root
                    value={String(answers[exercise.id] ?? '')}
                    onChange={(event) =>
                      setAnswers((current) => ({ ...current, [exercise.id]: event.target.value }))
                    }
                    placeholder="Válasz"
                  />
                </section>
              ))
            )}
            {saveDraft.error ? <ErrorState error={saveDraft.error} /> : null}
            {submit.error ? <ErrorState error={submit.error} /> : null}
            <div className="row">
              <Button variant="soft" onClick={() => saveDraft.mutate()} loading={saveDraft.isPending}>
                Piszkozat mentése
              </Button>
              <Button onClick={() => submit.mutate()} loading={submit.isPending}>
                Végleges beadás
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );

  return (
    <div className="student-shell">
      <Card className="student-card">
        <div className="stack">
          <div className="row-between">
            <Heading>Feladataim</Heading>
            <Button
              variant="ghost"
              onClick={() => {
                localStorage.removeItem('fonat.student-access');
                setAccess(null);
              }}
            >
              Kilépés
            </Button>
          </div>
          <Heading size="4">Assignmentek</Heading>
          {assignments.isLoading ? (
            <Loading />
          ) : assignments.error ? (
            <ErrorState error={assignments.error} />
          ) : assignments.data?.items.length ? (
            assignments.data.items.map((item) => (
              <button key={item.id} className="option-button" onClick={() => setSelectedId(item.id)}>
                <span>{item.title}</span>
                <Badge>{item.type}</Badge>
              </button>
            ))
          ) : (
            <Text color="gray">Nincs aktív assignment.</Text>
          )}
          <Heading size="4">Online értékelések</Heading>
          {deliveries.isLoading ? (
            <Loading />
          ) : deliveries.error ? (
            <ErrorState error={deliveries.error} />
          ) : deliveries.data?.items.length ? (
            deliveries.data.items.map((delivery) => (
              <button
                key={delivery.id}
                className="option-button"
                disabled={delivery.status === 'submitted'}
                onClick={() => setSelectedDeliveryId(delivery.id)}
              >
                <span>{delivery.assessmentId}</span>
                <span className="row">
                  <Badge>{delivery.variantKey}</Badge>
                  <Badge>{delivery.status}</Badge>
                </span>
              </button>
            ))
          ) : (
            <Text color="gray">Nincs kiosztott értékelés.</Text>
          )}
        </div>
      </Card>
    </div>
  );
}
