import type { GraphNode, Page } from '@fonat/contracts';
import { Badge, Button, Select, TextField } from '@radix-ui/themes';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { Empty, ErrorState, Loading } from '../components/AsyncState';
import { PageHeader } from '../components/PageHeader';
import { title } from '../components/NodeRenderer';

const types = ['', 'concept', 'resource', 'exercise', 'lesson-blueprint', 'teaching-profile', 'assessment'];

export function LibraryPage() {
  const [type, setType] = useState('');
  const [search, setSearch] = useState('');
  const query = useQuery({
    queryKey: ['nodes', type, search],
    queryFn: () =>
      api<Page<GraphNode>>(
        `/api/nodes?limit=100${type ? `&type=${type}` : ''}${search ? `&q=${encodeURIComponent(search)}` : ''}`
      )
  });
  return (
    <div className="page">
      <PageHeader
        title="Tartalomtár"
        subtitle="Fogalmak, források, feladatok és újrafelhasználható tervezési elemek."
        actions={
          <Link to="/library/new">
            <Button>Új tartalom</Button>
          </Link>
        }
      />
      <div className="panel">
        <div className="toolbar">
          <TextField.Root
            placeholder="Keresés címben és címkékben"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            style={{ minWidth: 280 }}
          />
          <Select.Root value={type || 'all'} onValueChange={(value) => setType(value === 'all' ? '' : value)}>
            <Select.Trigger />
            <Select.Content>
              <Select.Item value="all">Minden típus</Select.Item>
              {types.filter(Boolean).map((item) => (
                <Select.Item key={item} value={item}>
                  {item}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
        </div>
      </div>
      <section className="panel" style={{ marginTop: 16 }}>
        {query.isLoading ? (
          <Loading />
        ) : query.error ? (
          <ErrorState error={query.error} />
        ) : query.data?.items.length ? (
          <div className="data-list">
            {query.data.items.map((node) => (
              <Link className="data-row" to={`/library/${node.id}`} key={node.id}>
                <div>
                  <strong>{title(node)}</strong>
                  <div className="muted small">{node.summary?.values.hu ?? node.id}</div>
                </div>
                <div className="row">
                  <Badge>{node.type}</Badge>
                  <Badge color={node.lifecycle === 'published' ? 'green' : 'gray'}>{node.lifecycle}</Badge>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <Empty>Nincs találat.</Empty>
        )}
      </section>
    </div>
  );
}
