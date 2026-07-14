import { useMemo, useState } from 'react';
import { Button, Dialog, Select, TextField } from '@radix-ui/themes';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { GraphNode, GraphRelation } from '@fonat/contracts';
import { api } from '../../api';

const types = [
  'requires',
  'extends',
  'covers',
  'alternative-to',
  'uses',
  'instantiates',
  'belongs-to',
  'satisfies',
  'assesses',
  'demonstrates',
  'variant-of',
  'contains',
  'project-connects'
];
export function RelationEditor({ nodeId }: { nodeId: string }) {
  const client = useQueryClient();
  const [type, setType] = useState('covers');
  const [targetId, setTargetId] = useState('');
  const [contribution, setContribution] = useState('1');
  const [similarity, setSimilarity] = useState('0.8');
  const [query, setQuery] = useState('');
  const nodes = useQuery({
    queryKey: ['relation-candidates', query],
    queryFn: () => api<{ items: GraphNode[] }>(`/api/nodes?limit=30&q=${encodeURIComponent(query)}`)
  });
  const candidates = useMemo(
    () => nodes.data?.items.filter((node) => node.id !== nodeId) ?? [],
    [nodes.data, nodeId]
  );
  const create = useMutation({
    mutationFn: () =>
      api<GraphRelation>('/api/v2/relations', {
        method: 'POST',
        body: JSON.stringify({
          type,
          sourceId: nodeId,
          targetId,
          dimensions:
            type === 'covers'
              ? { contribution: Number(contribution) }
              : type === 'alternative-to'
                ? { similarity: Number(similarity) }
                : {}
        })
      }),
    onSuccess: () => client.invalidateQueries({ queryKey: ['node', nodeId] })
  });
  return (
    <Dialog.Root>
      <Dialog.Trigger>
        <Button variant="soft">Kapcsolat hozzáadása</Button>
      </Dialog.Trigger>
      <Dialog.Content>
        <Dialog.Title>Új típusos kapcsolat</Dialog.Title>
        <div className="stack">
          <label>
            Típus
            <Select.Root value={type} onValueChange={setType}>
              <Select.Trigger />
              <Select.Content>
                {types.map((value) => (
                  <Select.Item value={value} key={value}>
                    {value}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
          </label>
          <label>
            Keresés
            <TextField.Root
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Fogalom, feladat vagy erőforrás"
            />
          </label>
          <label>
            Cél
            <Select.Root value={targetId} onValueChange={setTargetId}>
              <Select.Trigger placeholder="Válassz elemet" />
              <Select.Content>
                {candidates.map((node) => (
                  <Select.Item value={node.id} key={node.id}>
                    {node.title.values.hu ?? node.id} · {node.type}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
          </label>
          {type === 'covers' && (
            <label>
              Lefedési hozzájárulás
              <TextField.Root
                type="number"
                min="0"
                max="1"
                step="0.1"
                value={contribution}
                onChange={(event) => setContribution(event.target.value)}
              />
            </label>
          )}
          {type === 'alternative-to' && (
            <label>
              Hasonlóság
              <TextField.Root
                type="number"
                min="0"
                max="1"
                step="0.1"
                value={similarity}
                onChange={(event) => setSimilarity(event.target.value)}
              />
            </label>
          )}
          <Button disabled={!targetId || create.isPending} onClick={() => create.mutate()}>
            Kapcsolás
          </Button>
          {create.error && <p className="error-text">{create.error.message}</p>}
        </div>
      </Dialog.Content>
    </Dialog.Root>
  );
}
