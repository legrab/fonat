import type {
  Course,
  Enrollment,
  LearnerGroup,
  LearnerProfileV2,
  SessionUser,
  TeachingLocation
} from '@fonat/contracts';
import { Badge, Button, Card, Dialog, Select, Tabs, TextField } from '@radix-ui/themes';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';
import { Empty, ErrorState, Loading } from '../components/AsyncState';
import { PageHeader } from '../components/PageHeader';

type Page<T> = { items: T[]; nextCursor?: string; total?: number };
type SubjectNode = { id: string; title: { values: Record<string, string> } };

function now() {
  return new Date().toISOString();
}

function CreateDialog({
  kind,
  userId,
  groups,
  subjects,
  locations
}: {
  kind: 'group' | 'course' | 'learner' | 'location';
  userId: string;
  groups: LearnerGroup[];
  subjects: SubjectNode[];
  locations: TeachingLocation[];
}) {
  const client = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [schoolYear, setSchoolYear] = useState('2026/27');
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? 'subject.math');
  const [groupId, setGroupId] = useState(groups[0]?.id ?? '');
  const [locationId, setLocationId] = useState(locations[0]?.id ?? '');
  const mutation = useMutation({
    mutationFn: async () => {
      const timestamp = now();
      const id = `${kind}.${crypto.randomUUID()}`;
      if (kind === 'group')
        return api('/api/v2/learner-groups', {
          method: 'POST',
          body: JSON.stringify({
            id,
            name,
            shortCode: code || name,
            schoolYear,
            ownerTeacherIds: [userId],
            active: true,
            version: 0,
            createdAt: timestamp,
            updatedAt: timestamp
          })
        });
      if (kind === 'course')
        return api('/api/v2/courses', {
          method: 'POST',
          body: JSON.stringify({
            id,
            name,
            subjectId,
            schoolYear,
            ownerTeacherIds: [userId],
            learnerGroupIds: groupId ? [groupId] : [],
            includeLearnerIds: [],
            excludeLearnerIds: [],
            defaultLocationId: locationId || undefined,
            timezone: 'Europe/Budapest',
            active: true,
            version: 0,
            createdAt: timestamp,
            updatedAt: timestamp
          })
        });
      if (kind === 'learner')
        return api('/api/v2/learners-v2', {
          method: 'POST',
          body: JSON.stringify({
            id,
            nickname: name,
            badgeIcon: code || '🦊',
            badgeColor: '#486B91',
            active: true,
            profile: {},
            version: 0,
            createdAt: timestamp,
            updatedAt: timestamp
          })
        });
      return api('/api/v2/teaching-locations', {
        method: 'POST',
        body: JSON.stringify({
          id,
          name,
          shortCode: code || name,
          notes: '',
          equipmentTags: [],
          archived: false,
          version: 0,
          createdAt: timestamp,
          updatedAt: timestamp
        })
      });
    },
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['organization'] });
      setOpen(false);
      setName('');
      setCode('');
    }
  });
  const title = {
    group: 'Tanulócsoport',
    course: 'Kurzus',
    learner: 'Tanuló',
    location: 'Helyszín'
  }[kind];
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger>
        <Button variant="soft">Új {title.toLocaleLowerCase('hu-HU')}</Button>
      </Dialog.Trigger>
      <Dialog.Content>
        <Dialog.Title>{title} létrehozása</Dialog.Title>
        <div className="stack">
          <label>
            Név
            <TextField.Root value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <label>
            {kind === 'learner' ? 'Jelvény' : 'Rövid kód'}
            <TextField.Root value={code} onChange={(event) => setCode(event.target.value)} />
          </label>
          {(kind === 'group' || kind === 'course') && (
            <label>
              Tanév
              <TextField.Root value={schoolYear} onChange={(event) => setSchoolYear(event.target.value)} />
            </label>
          )}
          {kind === 'course' && (
            <>
              <label>
                Tantárgy
                <Select.Root value={subjectId} onValueChange={setSubjectId}>
                  <Select.Trigger />
                  <Select.Content>
                    {subjects.map((subject) => (
                      <Select.Item key={subject.id} value={subject.id}>
                        {subject.title.values.hu ?? subject.title.values.en ?? subject.id}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
              </label>
              <label>
                Tanulócsoport
                <Select.Root value={groupId} onValueChange={setGroupId}>
                  <Select.Trigger placeholder="Válassz csoportot" />
                  <Select.Content>
                    {groups.map((group) => (
                      <Select.Item key={group.id} value={group.id}>
                        {group.name}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
              </label>
              <label>
                Alapértelmezett helyszín
                <Select.Root value={locationId} onValueChange={setLocationId}>
                  <Select.Trigger placeholder="Válassz helyszínt" />
                  <Select.Content>
                    {locations.map((location) => (
                      <Select.Item key={location.id} value={location.id}>
                        {location.name}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
              </label>
            </>
          )}
          <Button disabled={!name || mutation.isPending} onClick={() => mutation.mutate()}>
            Létrehozás
          </Button>
          {mutation.error && <p className="error-text">{mutation.error.message}</p>}
        </div>
      </Dialog.Content>
    </Dialog.Root>
  );
}

export function ClassesPage() {
  const groups = useQuery({
    queryKey: ['organization', 'groups'],
    queryFn: () => api<Page<LearnerGroup>>('/api/v2/learner-groups')
  });
  const courses = useQuery({
    queryKey: ['organization', 'courses'],
    queryFn: () => api<Page<Course>>('/api/v2/courses')
  });
  const learners = useQuery({
    queryKey: ['organization', 'learners'],
    queryFn: () => api<Page<LearnerProfileV2>>('/api/v2/learners-v2')
  });
  const locations = useQuery({
    queryKey: ['organization', 'locations'],
    queryFn: () => api<Page<TeachingLocation>>('/api/v2/teaching-locations')
  });
  const subjects = useQuery({
    queryKey: ['organization', 'subjects'],
    queryFn: () => api<Page<SubjectNode>>('/api/nodes?type=subject&limit=100')
  });
  const me = useQuery({ queryKey: ['me'], queryFn: () => api<SessionUser>('/api/me') });
  const pending = groups.isLoading || courses.isLoading || learners.isLoading || locations.isLoading;
  const error = groups.error ?? courses.error ?? learners.error ?? locations.error;
  if (pending)
    return (
      <div className="page">
        <Loading />
      </div>
    );
  if (error)
    return (
      <div className="page">
        <ErrorState error={error} />
      </div>
    );
  return (
    <div className="page">
      <PageHeader
        title="Csoportok és kurzusok"
        subtitle="A tanulócsoport megőrzi a közösséget, a kurzus pedig egy tantárgy adott tanévi tanítási tere."
        actions={
          me.data ? (
            <div className="row wrap">
              <CreateDialog
                kind="group"
                userId={me.data.id}
                groups={groups.data?.items ?? []}
                subjects={subjects.data?.items ?? []}
                locations={locations.data?.items ?? []}
              />
              <CreateDialog
                kind="course"
                userId={me.data.id}
                groups={groups.data?.items ?? []}
                subjects={subjects.data?.items ?? []}
                locations={locations.data?.items ?? []}
              />
              <CreateDialog
                kind="learner"
                userId={me.data.id}
                groups={groups.data?.items ?? []}
                subjects={subjects.data?.items ?? []}
                locations={locations.data?.items ?? []}
              />
              <CreateDialog
                kind="location"
                userId={me.data.id}
                groups={groups.data?.items ?? []}
                subjects={subjects.data?.items ?? []}
                locations={locations.data?.items ?? []}
              />
            </div>
          ) : undefined
        }
      />
      <Tabs.Root defaultValue="courses">
        <Tabs.List>
          <Tabs.Trigger value="courses">Kurzusok</Tabs.Trigger>
          <Tabs.Trigger value="groups">Tanulócsoportok</Tabs.Trigger>
          <Tabs.Trigger value="learners">Tanulók</Tabs.Trigger>
          <Tabs.Trigger value="locations">Helyszínek</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="courses">
          <div className="grid grid-2 top-gap">
            {courses.data?.items.map((course) => (
              <Link key={course.id} to={`/classes/course/${course.id}`}>
                <Card>
                  <h2>{course.name}</h2>
                  <div className="row wrap">
                    <Badge>{course.schoolYear}</Badge>
                    <Badge>{course.learnerGroupIds.length} csoport</Badge>
                    {!course.active && <Badge color="gray">lezárt</Badge>}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
          {!courses.data?.items.length && <Empty>Még nincs kurzus.</Empty>}
        </Tabs.Content>
        <Tabs.Content value="groups">
          <div className="grid grid-2 top-gap">
            {groups.data?.items.map((group) => (
              <Link key={group.id} to={`/classes/group/${group.id}`}>
                <Card>
                  <h2>{group.name}</h2>
                  <div className="row">
                    <Badge>{group.shortCode}</Badge>
                    <Badge>{group.schoolYear}</Badge>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
          {!groups.data?.items.length && <Empty>Még nincs tanulócsoport.</Empty>}
        </Tabs.Content>
        <Tabs.Content value="learners">
          <div className="grid grid-3 top-gap">
            {learners.data?.items.map((learner) => (
              <Link key={learner.id} to={`/classes/learner/${learner.id}`}>
                <Card>
                  <div style={{ fontSize: 36 }}>{learner.badgeIcon}</div>
                  <h2>{learner.nickname}</h2>
                  <Badge color={learner.active ? 'green' : 'gray'}>
                    {learner.active ? 'aktív' : 'inaktív'}
                  </Badge>
                </Card>
              </Link>
            ))}
          </div>
        </Tabs.Content>
        <Tabs.Content value="locations">
          <div className="grid grid-3 top-gap">
            {locations.data?.items.map((location) => (
              <Card key={location.id}>
                <h2>{location.name}</h2>
                <Badge>{location.shortCode}</Badge>
                {location.equipmentTags.length ? <p>{location.equipmentTags.join(', ')}</p> : null}
              </Card>
            ))}
          </div>
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}

export function LearnerGroupPage() {
  const { id } = useParams();
  const client = useQueryClient();
  const groups = useQuery({
    queryKey: ['organization', 'groups'],
    queryFn: () => api<Page<LearnerGroup>>('/api/v2/learner-groups')
  });
  const learners = useQuery({
    queryKey: ['organization', 'learners'],
    queryFn: () => api<Page<LearnerProfileV2>>('/api/v2/learners-v2')
  });
  const enrollments = useQuery({
    queryKey: ['organization', 'enrollments'],
    queryFn: () => api<Page<Enrollment>>('/api/v2/enrollments')
  });
  const group = groups.data?.items.find((item) => item.id === id);
  const enrolledIds = new Set(
    enrollments.data?.items
      .filter((entry) => entry.learnerGroupId === id && entry.status === 'active')
      .map((entry) => entry.learnerId) ?? []
  );
  const available = learners.data?.items.filter((learner) => !enrolledIds.has(learner.id)) ?? [];
  const [learnerId, setLearnerId] = useState('');
  const enroll = useMutation({
    mutationFn: () => {
      const timestamp = now();
      return api('/api/v2/enrollments', {
        method: 'POST',
        body: JSON.stringify({
          id: `enrollment.${crypto.randomUUID()}`,
          learnerId,
          learnerGroupId: id,
          startDate: timestamp.slice(0, 10),
          status: 'active',
          version: 0,
          createdAt: timestamp,
          updatedAt: timestamp
        })
      });
    },
    onSuccess: async () => {
      setLearnerId('');
      await client.invalidateQueries({ queryKey: ['organization', 'enrollments'] });
    }
  });
  if (groups.isLoading || learners.isLoading || enrollments.isLoading)
    return (
      <div className="page">
        <Loading />
      </div>
    );
  if (!group)
    return (
      <div className="page">
        <Empty>A tanulócsoport nem található.</Empty>
      </div>
    );
  const members = learners.data?.items.filter((learner) => enrolledIds.has(learner.id)) ?? [];
  return (
    <div className="page">
      <PageHeader title={group.name} subtitle={`${group.shortCode} · ${group.schoolYear}`} />
      <section className="panel">
        <h2>Aktív tagok</h2>
        <div className="grid grid-3">
          {members.map((learner) => (
            <Link key={learner.id} to={`/classes/learner/${learner.id}`}>
              <Card>
                <div style={{ fontSize: 34 }}>{learner.badgeIcon}</div>
                <strong>{learner.nickname}</strong>
              </Card>
            </Link>
          ))}
        </div>
        {!members.length && <Empty>A csoportban még nincs aktív tanuló.</Empty>}
      </section>
      {available.length ? (
        <section className="panel top-gap">
          <h2>Tanuló felvétele</h2>
          <div className="row">
            <Select.Root value={learnerId} onValueChange={setLearnerId}>
              <Select.Trigger placeholder="Válassz tanulót" />
              <Select.Content>
                {available.map((learner) => (
                  <Select.Item key={learner.id} value={learner.id}>
                    {learner.nickname}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
            <Button disabled={!learnerId || enroll.isPending} onClick={() => enroll.mutate()}>
              Felvétel
            </Button>
          </div>
        </section>
      ) : null}
    </div>
  );
}

export function CoursePage() {
  const { id } = useParams();
  const courses = useQuery({
    queryKey: ['organization', 'courses'],
    queryFn: () => api<Page<Course>>('/api/v2/courses')
  });
  const groups = useQuery({
    queryKey: ['organization', 'groups'],
    queryFn: () => api<Page<LearnerGroup>>('/api/v2/learner-groups')
  });
  const locations = useQuery({
    queryKey: ['organization', 'locations'],
    queryFn: () => api<Page<TeachingLocation>>('/api/v2/teaching-locations')
  });
  const roster = useQuery({
    queryKey: ['organization', 'course-roster', id],
    enabled: Boolean(id),
    queryFn: () => api<LearnerProfileV2[]>(`/api/v2/courses/${id}/roster`)
  });
  const course = courses.data?.items.find((item) => item.id === id);
  if (courses.isLoading || groups.isLoading || locations.isLoading || roster.isLoading)
    return (
      <div className="page">
        <Loading />
      </div>
    );
  if (!course)
    return (
      <div className="page">
        <Empty>A kurzus nem található.</Empty>
      </div>
    );
  const groupNames = course.learnerGroupIds.map(
    (groupId) => groups.data?.items.find((group) => group.id === groupId)?.name ?? groupId
  );
  const location = locations.data?.items.find((item) => item.id === course.defaultLocationId);
  return (
    <div className="page">
      <PageHeader
        title={course.name}
        subtitle={`${course.schoolYear} · ${groupNames.join(', ') || 'egyéni kurzus'} · ${location?.name ?? 'nincs alaphelyszín'}`}
      />
      <section className="panel">
        <h2>Kurzusnévsor</h2>
        <div className="grid grid-3">
          {roster.data?.map((learner) => (
            <Link key={learner.id} to={`/classes/learner/${learner.id}`}>
              <Card>
                <div style={{ fontSize: 34 }}>{learner.badgeIcon}</div>
                <strong>{learner.nickname}</strong>
              </Card>
            </Link>
          ))}
        </div>
        {!roster.data?.length && <Empty>A kurzusnak nincs aktív tanulója.</Empty>}
      </section>
      <div className="row top-gap">
        <Link to="/timetable">
          <Button variant="soft">Heti órarend</Button>
        </Link>
        <Link to="/assignments">
          <Button variant="soft">Kiosztások</Button>
        </Link>
      </div>
    </div>
  );
}

type LearnerOverview = {
  learner: LearnerProfileV2;
  submissions: Array<{
    id: string;
    exerciseId: string;
    status: string;
    teacherScore?: number;
    automaticScore?: number;
    maxScore: number;
    attempt: number;
    feedback?: string;
  }>;
  evidence: Array<{ id: string; type: string; conceptIds: string[]; createdAt: string }>;
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
        subtitle="Bizonyítékokra épülő áttekintés, nem automatikus ítélet."
      />
      <div className="grid grid-2">
        <section className="panel">
          <h2>Fogalomállapotok</h2>
          {conceptStates.length ? (
            conceptStates.map((state) => (
              <div className="data-row" key={state.conceptId}>
                <div>
                  <strong>{state.conceptId}</strong>
                  <div className="muted small">{state.explanation}</div>
                </div>
                <Badge>{state.state}</Badge>
              </div>
            ))
          ) : (
            <Empty>Még nincs elég bizonyíték.</Empty>
          )}
        </section>
        <section className="panel">
          <h2>Próbálkozások és javítások</h2>
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
          {!submissions.length && <Empty>Még nincs beadás.</Empty>}
        </section>
      </div>
      <section className="panel top-gap">
        <h2>Legutóbbi bizonyítékok</h2>
        {evidence.slice(0, 12).map((item) => (
          <div className="data-row" key={item.id}>
            <div>
              <strong>{item.type}</strong>
              <div className="muted small">{item.conceptIds.join(', ')}</div>
            </div>
            <span>{new Date(item.createdAt).toLocaleDateString('hu-HU')}</span>
          </div>
        ))}
      </section>
    </div>
  );
}
