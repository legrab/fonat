import { useEffect, useState } from 'react';
import { Badge, Button, Card, Table } from '@radix-ui/themes';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api';
import { PageHeader } from '../../components/PageHeader';

type Week = {
  weekStart: string;
  items: Array<{
    id: string;
    date: string;
    localStart: string;
    courseName: string;
    learnerGroups: string[];
    locationName: string;
    overlap: boolean;
  }>;
};
export function TimetablePage() {
  const capabilities = useQuery({
    queryKey: ['v2-capabilities'],
    queryFn: () => api<{ demoClock: string }>('/api/v2/capabilities')
  });
  const [anchor, setAnchor] = useState(new Date().toISOString().slice(0, 10));
  useEffect(() => {
    if (capabilities.data?.demoClock) setAnchor(capabilities.data.demoClock.slice(0, 10));
  }, [capabilities.data?.demoClock]);
  const week = useQuery({
    queryKey: ['timetable', anchor],
    queryFn: () => api<Week>(`/api/v2/timetable/week?anchor=${anchor}`)
  });
  const shift = (days: number) => {
    const date = new Date(`${anchor}T12:00:00Z`);
    date.setUTCDate(date.getUTCDate() + days);
    setAnchor(date.toISOString().slice(0, 10));
  };
  return (
    <div className="page">
      <PageHeader
        title="Heti órarend"
        subtitle="Kurzus, tanulócsoport és tanítási helyszín egy nézetben."
        actions={
          <div className="row">
            <Button variant="soft" onClick={() => shift(-7)}>
              Előző hét
            </Button>
            <Button
              variant="soft"
              onClick={() => setAnchor(capabilities.data?.demoClock.slice(0, 10) ?? anchor)}
            >
              Demo hét
            </Button>
            <Button variant="soft" onClick={() => shift(7)}>
              Következő hét
            </Button>
          </div>
        }
      />
      <Card>
        <Table.Root variant="surface">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell>Nap</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Idő</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Kurzus</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Csoport</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Terem</Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {week.data?.items.map((item) => (
              <Table.Row key={item.id}>
                <Table.Cell>{item.date}</Table.Cell>
                <Table.Cell>{item.localStart}</Table.Cell>
                <Table.Cell>{item.courseName}</Table.Cell>
                <Table.Cell>{item.learnerGroups.join(', ')}</Table.Cell>
                <Table.Cell>
                  {item.locationName} {item.overlap && <Badge color="red">Ütközés</Badge>}
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
        {!week.isLoading && !week.data?.items.length && (
          <p className="empty">Ehhez a héthez nincs ismétlődő órarendi bejegyzés.</p>
        )}
      </Card>
    </div>
  );
}
