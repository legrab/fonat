import type { GraphNode } from '@fonat/contracts';
import { Badge, Button, Card } from '@radix-ui/themes';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import { useParams } from 'react-router-dom';
import { api } from '../api';
import { ErrorState, Loading } from '../components/AsyncState';
import { NodeRenderer } from '../components/NodeRenderer';

type Poll = {
  session: {
    id: string;
    code: string;
    status: string;
    currentIndex: number;
    total: number;
    participantCount: number;
    leaderboard: boolean;
  };
  exercise: GraphNode | null;
  answerCount: number;
  distribution?: Record<string, number>;
};

export function LiveControlPage() {
  const { code } = useParams();
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ['live-control', code],
    queryFn: () => api<Poll>(`/api/live-sessions/${code}/poll`),
    refetchInterval: 2500
  });
  const action = useMutation({
    mutationFn: (value: string) =>
      api(`/api/live-sessions/${code}`, { method: 'PATCH', body: JSON.stringify({ action: value }) }),
    onSuccess: () => client.invalidateQueries({ queryKey: ['live-control', code] })
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
  return (
    <div className="page">
      <div className="grid grid-2">
        <Card>
          <QRCodeSVG value={`${window.location.origin}/student/join/${code}`} size={220} />
          <h1>{code}</h1>
          <div className="row">
            <Badge>{query.data.session.participantCount} résztvevő</Badge>
            <Badge>{query.data.answerCount} válasz</Badge>
            <Badge>{query.data.session.status}</Badge>
          </div>
        </Card>
        <Card>
          <div className="stack">
            {query.data.exercise ? <NodeRenderer node={query.data.exercise} /> : <p>Nincs aktív kérdés.</p>}
            <div className="toolbar">
              <Button onClick={() => action.mutate('open')}>Válaszok nyitása</Button>
              <Button variant="soft" onClick={() => action.mutate('reveal')}>
                Megoldás mutatása
              </Button>
              <Button variant="soft" onClick={() => action.mutate('previous')}>
                Előző
              </Button>
              <Button onClick={() => action.mutate('next')}>Következő</Button>
              <Button color="red" onClick={() => action.mutate('close')}>
                Bezárás
              </Button>
            </div>
            {query.data.distribution ? <pre>{JSON.stringify(query.data.distribution, null, 2)}</pre> : null}
          </div>
        </Card>
      </div>
    </div>
  );
}
