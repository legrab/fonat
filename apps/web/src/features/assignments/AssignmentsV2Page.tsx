import { useMemo, useState } from 'react';
import { Badge, Button, Card, Dialog, Select, Table, TextField } from '@radix-ui/themes';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Assignment, Course } from '@fonat/contracts';
import { api } from '../../api';
import { PageHeader } from '../../components/PageHeader';

export function AssignmentsV2Page() {
  const queryClient = useQueryClient();
  const assignments = useQuery({
    queryKey: ['assignments-v2'],
    queryFn: () => api<{ items: Assignment[] }>('/api/v2/assignments')
  });
  const courses = useQuery({
    queryKey: ['courses-v2'],
    queryFn: () => api<{ items: Course[] }>('/api/v2/courses')
  });
  const [title, setTitle] = useState('Új otthoni gyakorlás');
  const [courseId, setCourseId] = useState('');
  const create = useMutation({
    mutationFn: () =>
      api<Assignment>('/api/v2/assignments', {
        method: 'POST',
        body: JSON.stringify({
          id: `assignment.${crypto.randomUUID()}`,
          title,
          courseId,
          type: 'homework',
          targetLearnerIds: [],
          exerciseRefs: [],
          status: 'draft',
          policy: {
            maxAttempts: 2,
            feedbackRelease: 'after-submit',
            answerReveal: 'after-acceptance',
            allowDrafts: true,
            evidenceIntensity: 'standard'
          },
          version: 0,
          createdBy: 'current',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['assignments-v2'] })
  });
  const courseMap = useMemo(() => new Map(courses.data?.items.map((c) => [c.id, c.name])), [courses.data]);
  return (
    <div className="page">
      <PageHeader
        title="Assignmentek"
        subtitle="Otthoni munka, gyakorlás, kvíz és formális értékelés közös kiosztási életciklussal."
        actions={
          <Dialog.Root>
            <Dialog.Trigger>
              <Button>Új assignment</Button>
            </Dialog.Trigger>
            <Dialog.Content>
              <Dialog.Title>Új assignment</Dialog.Title>
              <div className="stack">
                <label>
                  Cím
                  <TextField.Root value={title} onChange={(e) => setTitle(e.target.value)} />
                </label>
                <label>
                  Kurzus
                  <Select.Root value={courseId} onValueChange={setCourseId}>
                    <Select.Trigger placeholder="Válassz kurzust" />
                    <Select.Content>
                      {courses.data?.items.map((c) => (
                        <Select.Item value={c.id} key={c.id}>
                          {c.name}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Root>
                </label>
                <Button disabled={!courseId || create.isPending} onClick={() => create.mutate()}>
                  Létrehozás
                </Button>
              </div>
            </Dialog.Content>
          </Dialog.Root>
        }
      />
      <Card>
        <Table.Root>
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell>Cím</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Kurzus</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Típus</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Állapot</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Próbálkozás</Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {assignments.data?.items.map((a) => (
              <Table.Row key={a.id}>
                <Table.Cell>{a.title}</Table.Cell>
                <Table.Cell>{courseMap.get(a.courseId) ?? a.courseId}</Table.Cell>
                <Table.Cell>{a.type}</Table.Cell>
                <Table.Cell>
                  <Badge>{a.status}</Badge>
                </Table.Cell>
                <Table.Cell>{a.policy.maxAttempts}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Card>
    </div>
  );
}
