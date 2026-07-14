import { Button, Card, Heading, Tabs, Text } from '@radix-ui/themes';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { ErrorState, Loading } from '../components/AsyncState';

type LoginForm = { username: string; password: string };
type BootstrapForm = { username: string; displayName: string; password: string; loadDemo: boolean };

export function AuthPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const status = useQuery({
    queryKey: ['setup-status'],
    queryFn: () => api<{ requiresBootstrap: boolean }>('/api/setup/status')
  });
  const loginForm = useForm<LoginForm>({ defaultValues: { username: '', password: '' } });
  const bootstrapForm = useForm<BootstrapForm>({
    defaultValues: { username: 'admin', displayName: 'Fonat tanár', password: '', loadDemo: true }
  });
  const login = useMutation({
    mutationFn: (values: LoginForm) =>
      api('/api/auth/login', { method: 'POST', body: JSON.stringify(values) }),
    onSuccess: async () => {
      await queryClient.invalidateQueries();
      navigate('/today');
    }
  });
  const bootstrap = useMutation({
    mutationFn: (values: BootstrapForm) =>
      api('/api/setup/bootstrap', { method: 'POST', body: JSON.stringify(values) }),
    onSuccess: async () => {
      await queryClient.invalidateQueries();
      navigate('/today');
    }
  });
  if (status.isLoading)
    return (
      <div className="student-shell">
        <Loading />
      </div>
    );
  if (status.error)
    return (
      <div className="student-shell">
        <ErrorState error={status.error} />
      </div>
    );
  return (
    <div className="student-shell">
      <Card className="student-card">
        <div className="stack">
          <div>
            <Heading size="8">Fonat</Heading>
            <Text color="gray">Szálról szálra.</Text>
          </div>
          <Tabs.Root defaultValue={status.data?.requiresBootstrap ? 'bootstrap' : 'login'}>
            <Tabs.List>
              <Tabs.Trigger value="login">Belépés</Tabs.Trigger>
              {status.data?.requiresBootstrap ? (
                <Tabs.Trigger value="bootstrap">Első beállítás</Tabs.Trigger>
              ) : null}
            </Tabs.List>
            <Tabs.Content value="login">
              <form
                className="input-grid"
                onSubmit={loginForm.handleSubmit((values) => login.mutate(values))}
              >
                <label>
                  Felhasználónév
                  <input className="input" {...loginForm.register('username', { required: true })} />
                </label>
                <label>
                  Jelszó
                  <input
                    className="input"
                    type="password"
                    {...loginForm.register('password', { required: true })}
                  />
                </label>
                {login.error ? <ErrorState error={login.error} /> : null}
                <Button type="submit" loading={login.isPending}>
                  Belépés
                </Button>
              </form>
            </Tabs.Content>
            {status.data?.requiresBootstrap ? (
              <Tabs.Content value="bootstrap">
                <form
                  className="input-grid"
                  onSubmit={bootstrapForm.handleSubmit((values) => bootstrap.mutate(values))}
                >
                  <label>
                    Felhasználónév
                    <input className="input" {...bootstrapForm.register('username', { required: true })} />
                  </label>
                  <label>
                    Megjelenített név
                    <input className="input" {...bootstrapForm.register('displayName', { required: true })} />
                  </label>
                  <label>
                    Jelszó
                    <input
                      className="input"
                      type="password"
                      {...bootstrapForm.register('password', { required: true, minLength: 10 })}
                    />
                  </label>
                  <label className="row">
                    <input type="checkbox" {...bootstrapForm.register('loadDemo')} /> Demonstrációs munkatér
                    betöltése
                  </label>
                  {bootstrap.error ? <ErrorState error={bootstrap.error} /> : null}
                  <Button type="submit" loading={bootstrap.isPending}>
                    Fonat indítása
                  </Button>
                </form>
              </Tabs.Content>
            ) : null}
          </Tabs.Root>
        </div>
      </Card>
    </div>
  );
}
