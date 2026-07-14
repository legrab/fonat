import type { ExercisePayload, GraphNode } from '@fonat/contracts';
import { Badge, Card, Flex, Text } from '@radix-ui/themes';
import { Markdown } from './Markdown';
import { MathPlot } from './MathPlot';

export function title(node: GraphNode, locale = 'hu') {
  return (
    node.title.values[locale] ??
    node.title.values[node.title.canonicalLanguage] ??
    Object.values(node.title.values)[0] ??
    node.id
  );
}

export function NodeRenderer({ node, compact = false }: { node: GraphNode; compact?: boolean }) {
  if (node.type === 'resource') {
    const payload = node.payload as Record<string, unknown>;
    if (payload.kind === 'math.2d-plot')
      return <MathPlot config={payload as Parameters<typeof MathPlot>[0]['config']} />;
    if (payload.kind === 'external-link')
      return (
        <Card>
          <Flex direction="column" gap="2">
            <Text weight="bold">{title(node)}</Text>
            <a href={String(payload.url)} target="_blank" rel="noreferrer">
              {String(payload.labelHu ?? 'Külső hivatkozás megnyitása')}
            </a>
            <Text size="1" color="gray">
              Külső tartalom, elérhetősége nem garantált.
            </Text>
          </Flex>
        </Card>
      );
    return (
      <div>
        {payload.svg ? <div dangerouslySetInnerHTML={{ __html: String(payload.svg) }} /> : null}
        <Markdown>{String(payload.markdown ?? '')}</Markdown>
      </div>
    );
  }
  if (node.type === 'exercise') {
    const payload = node.payload as ExercisePayload;
    return (
      <div className="stack">
        <div className="row">
          <Badge>{payload.exerciseType}</Badge>
          <Badge color="gray">{payload.durationMinutes} perc</Badge>
          <Badge color="gray">nehézség {payload.difficulty.cognitive}/5</Badge>
        </div>
        <Markdown>{payload.prompt.values.hu ?? ''}</Markdown>
        {!compact && payload.options.length ? (
          <div className="stack">
            {payload.options.map((option) => (
              <div key={option.id} className="option-button">
                {option.text.values.hu}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    );
  }
  return <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{JSON.stringify(node.payload, null, 2)}</pre>;
}
