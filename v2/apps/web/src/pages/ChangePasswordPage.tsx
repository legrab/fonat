import { Button, Card, Heading, TextField } from '@radix-ui/themes';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { ErrorState } from '../components/AsyncState';

export function ChangePasswordPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const change = useMutation({
    mutationFn: () =>
      api('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword })
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['me'] });
      navigate('/today');
    }
  });
  return (
    <div className="student-shell">
      <Card className="student-card">
        <div className="stack">
          <Heading>Új jelszó beállítása</Heading>
          <p className="muted">Az ideiglenes jelszó használata előtt saját jelszót kell választanod.</p>
          <label>
            Jelenlegi jelszó
            <TextField.Root
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </label>
          <label>
            Új jelszó
            <TextField.Root
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </label>
          {change.error ? <ErrorState error={change.error} /> : null}
          <Button
            disabled={newPassword.length < 10}
            loading={change.isPending}
            onClick={() => change.mutate()}
          >
            Jelszó cseréje
          </Button>
        </div>
      </Card>
    </div>
  );
}
