import { useState } from 'react';
import { Button, Callout, Card, Flex, TextField } from '@radix-ui/themes';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api';
import { PageHeader } from '../../components/PageHeader';

const initial = {
  learnerGroupName: '8.A',
  learnerGroupCode: '8A',
  courseName: '8.A matematika',
  subjectTitle: 'Matematika',
  schoolYear: '2026/27',
  locationName: 'Matematika terem',
  locationCode: 'M-12',
  learnerNicknames: 'Róka, Bagoly, Sün, Mókus, Borz',
  firstConceptTitle: 'Első fogalom',
  firstExercisePrompt: 'Írd le röviden, mit tudsz már erről a fogalomról.',
  firstLessonTitle: 'Első kapcsolódó óra',
  firstAssignmentTitle: 'Első gyakorlás',
  timezone: 'Europe/Budapest'
};

export function OnboardingPage() {
  const [form, setForm] = useState(initial);
  const navigate = useNavigate();
  const status = useQuery({
    queryKey: ['onboarding-status'],
    queryFn: () => api<{ complete: boolean }>('/api/v2/onboarding/status')
  });
  const mutation = useMutation({
    mutationFn: () =>
      api<Record<string, string>>('/api/v2/onboarding/complete', {
        method: 'POST',
        headers: { 'Idempotency-Key': crypto.randomUUID() },
        body: JSON.stringify({
          ...form,
          learnerNicknames: form.learnerNicknames
            .split(',')
            .map((value) => value.trim())
            .filter(Boolean)
        })
      }),
    onSuccess: (result) => navigate(`/planning/lesson/${result.lessonId}`)
  });
  const set = (key: keyof typeof form) => (value: string) =>
    setForm((current) => ({ ...current, [key]: value }));
  return (
    <div className="page">
      <PageHeader
        title="Első tanítási szál létrehozása"
        subtitle="A Fonat csak a használható minimumot kéri. Minden később továbbépíthető."
      />
      {status.data?.complete && (
        <Callout.Root color="blue">
          <Callout.Text>Az alapbeállítás már elkészült. Új kurzust ettől még létrehozhatsz.</Callout.Text>
        </Callout.Root>
      )}
      <Card className="stack form-grid">
        {Object.entries(form).map(([key, value]) => (
          <label className={key === 'learnerNicknames' || key.includes('Prompt') ? 'span-2' : ''} key={key}>
            <span>
              {
                (
                  {
                    learnerGroupName: 'Tanulócsoport',
                    learnerGroupCode: 'Csoportkód',
                    courseName: 'Kurzus neve',
                    subjectTitle: 'Tantárgy',
                    schoolYear: 'Tanév',
                    locationName: 'Helyszín',
                    locationCode: 'Helyszínkód',
                    learnerNicknames: 'Tanulói álnevek, vesszővel',
                    firstConceptTitle: 'Első fogalom',
                    firstExercisePrompt: 'Első feladat',
                    firstLessonTitle: 'Első óra',
                    firstAssignmentTitle: 'Első assignment',
                    timezone: 'Időzóna'
                  } as Record<string, string>
                )[key]
              }
            </span>
            <TextField.Root
              value={value}
              onChange={(event) => set(key as keyof typeof form)(event.target.value)}
            />
          </label>
        ))}
        <Flex gap="3" className="span-2">
          <Button size="3" disabled={mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending ? 'Létrehozás…' : 'Első szál létrehozása'}
          </Button>
          <Button variant="soft" onClick={() => navigate('/today')}>
            Mégse
          </Button>
        </Flex>
        {mutation.error && (
          <Callout.Root color="red" className="span-2">
            <Callout.Text>{mutation.error.message}</Callout.Text>
          </Callout.Root>
        )}
      </Card>
    </div>
  );
}
