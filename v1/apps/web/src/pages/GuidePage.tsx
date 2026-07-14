import { Tabs } from '@radix-ui/themes';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '../api';
import { ErrorState, Loading } from '../components/AsyncState';
import { PageHeader } from '../components/PageHeader';

type Guide = {
  tabs: Array<{ id: string; title: string; terms: Array<{ term: string; description: string }> }>;
};

export function GuidePage() {
  const [search, setSearch] = useState('');
  const query = useQuery({ queryKey: ['guide'], queryFn: () => api<Guide>('/api/guide') });
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
  const q = search.toLocaleLowerCase('hu-HU');
  return (
    <div className="page">
      <PageHeader
        title="Fonat kézikönyv"
        subtitle="A platform saját fogalmai röviden, egyetlen kanonikus helyen."
      />
      <div className="panel">
        <input
          className="input"
          placeholder="Fogalom keresése"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>
      <Tabs.Root defaultValue={query.data.tabs[0]?.id}>
        <Tabs.List>
          {query.data.tabs.map((tab) => (
            <Tabs.Trigger key={tab.id} value={tab.id}>
              {tab.title}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        {query.data.tabs.map((tab) => (
          <Tabs.Content key={tab.id} value={tab.id}>
            <section className="panel">
              <div className="data-list">
                {tab.terms
                  .filter(
                    (item) => !q || `${item.term} ${item.description}`.toLocaleLowerCase('hu-HU').includes(q)
                  )
                  .map((item) => (
                    <div className="data-row" key={item.term}>
                      <div>
                        <strong>{item.term}</strong>
                        <div className="muted">{item.description}</div>
                      </div>
                    </div>
                  ))}
              </div>
            </section>
          </Tabs.Content>
        ))}
      </Tabs.Root>
    </div>
  );
}
