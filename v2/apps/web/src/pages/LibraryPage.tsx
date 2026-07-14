import type { GraphNode, Page } from '@fonat/contracts';
import { Badge, Button, Select, TextField } from '@radix-ui/themes';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { Empty, ErrorState, Loading } from '../components/AsyncState';
import { PageHeader } from '../components/PageHeader';
import { title } from '../components/NodeRenderer';

const types = [
  ['', 'Minden típus'],
  ['concept', 'Fogalom'],
  ['resource', 'Forrás'],
  ['exercise', 'Feladat'],
  ['collection', 'Gyűjtemény'],
  ['activity-template', 'Tevékenységsablon'],
  ['rubric', 'Értékelési szempontsor'],
  ['lesson-blueprint', 'Óravázlat-sablon'],
  ['teaching-profile', 'Tanítási profil'],
  ['assessment', 'Értékelés']
] as const;

export function LibraryPage() {
  const [type, setType] = useState('');
  const [search, setSearch] = useState('');
  const query = useInfiniteQuery({
    queryKey: ['nodes', type, search],
    initialPageParam: '',
    queryFn: ({ pageParam }) =>
      api<Page<GraphNode>>(
        `/api/nodes?limit=40${type ? `&type=${type}` : ''}${search ? `&q=${encodeURIComponent(search)}` : ''}${pageParam ? `&cursor=${encodeURIComponent(pageParam)}` : ''}`
      ),
    getNextPageParam: (lastPage) => lastPage.nextCursor
  });
  const items = useMemo(() => query.data?.pages.flatMap((page) => page.items) ?? [], [query.data]);
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
            placeholder="Keresés címben, álnévben és tartalomban"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            style={{ minWidth: 280 }}
          />
          <Select.Root value={type || 'all'} onValueChange={(value) => setType(value === 'all' ? '' : value)}>
            <Select.Trigger />
            <Select.Content>
              {types.map(([value, label]) => (
                <Select.Item key={value || 'all'} value={value || 'all'}>
                  {label}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
        </div>
      </div>
      <section className="panel top-gap">
        {query.isLoading ? (
          <Loading />
        ) : query.error ? (
          <ErrorState error={query.error} />
        ) : items.length ? (
          <>
            <div className="data-list">
              {items.map((node) => (
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
            {query.hasNextPage ? (
              <Button
                variant="soft"
                loading={query.isFetchingNextPage}
                onClick={() => void query.fetchNextPage()}
                style={{ marginTop: 16 }}
              >
                További találatok
              </Button>
            ) : null}
          </>
        ) : (
          <Empty>Nincs találat.</Empty>
        )}
      </section>
    </div>
  );
}
