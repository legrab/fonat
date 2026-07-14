import type { GraphNode, Page } from '@fonat/contracts';
import { Button, Card, Select } from '@radix-ui/themes';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { ErrorState, Loading } from '../components/AsyncState';
import { PageHeader } from '../components/PageHeader';
import { title } from '../components/NodeRenderer';

type Form = {
  title: string;
  conceptId: string;
  intent: string;
  duration: number;
  profileId: string;
  blueprintId: string;
};

export function QuickLessonPage() {
  const navigate = useNavigate();
  const client = useQueryClient();
  const concepts = useQuery({
    queryKey: ['quick-concepts'],
    queryFn: () => api<Page<GraphNode>>('/api/nodes?type=concept&limit=100')
  });
  const profiles = useQuery({
    queryKey: ['quick-profiles'],
    queryFn: () => api<Page<GraphNode>>('/api/nodes?type=teaching-profile&limit=20')
  });
  const blueprints = useQuery({
    queryKey: ['quick-blueprints'],
    queryFn: () => api<Page<GraphNode>>('/api/nodes?type=lesson-blueprint&limit=20')
  });
  const form = useForm<Form>({
    defaultValues: {
      title: 'Gyors ismétlő óra',
      conceptId: 'concept.pythagorean',
      intent: 'revision',
      duration: 45,
      profileId: 'profile.balanced',
      blueprintId: 'blueprint.practice-45'
    }
  });
  const create = useMutation({
    mutationFn: async (values: Form) => {
      const now = new Date().toISOString();
      const blueprint = blueprints.data?.items.find((item) => item.id === values.blueprintId);
      const rawSections = (blueprint?.payload.sections as Array<[string, number]> | undefined) ?? [
        ['Felidézés', 5],
        ['Gyakorlás', 30],
        ['Lezárás', 10]
      ];
      const node: GraphNode = {
        id: `teacher.lesson.${crypto.randomUUID()}`,
        type: 'lesson',
        title: { canonicalLanguage: 'hu', values: { hu: values.title } },
        lifecycle: 'draft',
        quality: 'experimental',
        currentRevision: 1,
        payload: {
          durationMinutes: values.duration,
          intent: values.intent,
          teachingProfileId: values.profileId,
          blueprintId: values.blueprintId,
          layoutId: 'layout.compact',
          conceptIds: [values.conceptId],
          sections: rawSections.map(([name, minutes], index) => ({
            id: `section.${index + 1}`,
            title: name,
            durationMinutes: minutes,
            purpose: name.toLowerCase(),
            requiredActivityKinds: [],
            activityIds: [],
            slides: [
              {
                id: `slide.${index + 1}`,
                type: 'section-intro',
                title: name,
                content: `## ${name}`,
                teacherOnly: false
              }
            ]
          })),
          pinnedRevisions: {},
          status: 'draft',
          teacherNotes: '',
          runtimeSummary: {}
        },
        extensions: {},
        provenance: { origin: 'teacher' },
        rights: { status: 'teacher-owned', redistributionAllowed: false },
        tags: ['gyors-óra'],
        createdAt: now,
        updatedAt: now
      };
      return api<GraphNode>('/api/nodes', { method: 'POST', body: JSON.stringify(node) });
    },
    onSuccess: async (node) => {
      await client.invalidateQueries({ queryKey: ['planning-lessons'] });
      navigate(`/planning/lesson/${node.id}`);
    }
  });
  if (concepts.isLoading || profiles.isLoading || blueprints.isLoading)
    return (
      <div className="page">
        <Loading />
      </div>
    );
  return (
    <div className="page">
      <PageHeader
        title="Gyors óratervezés"
        subtitle="Egyetlen fogalommal is elindulhatsz, tanterv és éves terv nélkül."
      />
      <Card>
        <form className="input-grid" onSubmit={form.handleSubmit((values) => create.mutate(values))}>
          <label>
            Óra címe
            <input className="input" {...form.register('title', { required: true })} />
          </label>
          <label>
            Fő fogalom
            <Select.Root
              defaultValue={form.getValues('conceptId')}
              onValueChange={(value) => form.setValue('conceptId', value)}
            >
              <Select.Trigger />
              <Select.Content>
                {concepts.data?.items.map((concept) => (
                  <Select.Item key={concept.id} value={concept.id}>
                    {title(concept)}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
          </label>
          <label>
            Óra célja
            <select className="select" {...form.register('intent')}>
              <option value="revision">Ismétlés</option>
              <option value="introduction">Bevezetés</option>
              <option value="practice">Gyakorlás</option>
              <option value="formative-assessment">Formatív ellenőrzés</option>
            </select>
          </label>
          <label>
            Időtartam
            <input
              className="input"
              type="number"
              {...form.register('duration', { valueAsNumber: true, min: 10 })}
            />
          </label>
          <label>
            Tanítási profil
            <select className="select" {...form.register('profileId')}>
              {profiles.data?.items.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {title(profile)}
                </option>
              ))}
            </select>
          </label>
          <label>
            Óravázlat
            <select className="select" {...form.register('blueprintId')}>
              {blueprints.data?.items.map((blueprint) => (
                <option key={blueprint.id} value={blueprint.id}>
                  {title(blueprint)}
                </option>
              ))}
            </select>
          </label>
          {create.error ? <ErrorState error={create.error} /> : null}
          <Button type="submit" loading={create.isPending}>
            Óra létrehozása
          </Button>
        </form>
      </Card>
    </div>
  );
}
