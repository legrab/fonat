import { Button, DropdownMenu, Text } from '@radix-ui/themes';
import { useQueryClient } from '@tanstack/react-query';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../api';

const items = [
  ['/today', 'today'],
  ['/planning', 'planning'],
  ['/library', 'library'],
  ['/classes', 'classes'],
  ['/assessments', 'assessments'],
  ['/guide', 'guide'],
  ['/admin', 'admin']
] as const;

export function AppLayout({ user }: { user: { displayName: string } }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const logout = async () => {
    await api('/api/auth/logout', { method: 'POST' });
    queryClient.clear();
    navigate('/login');
  };
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-title">{t('brand')}</div>
          <div className="brand-motto">{t('motto')}</div>
        </div>
        <nav className="nav-list">
          {items.map(([href, key]) => (
            <NavLink
              key={href}
              to={href}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              {t(key)}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <Text size="2" color="gray">
            {user.displayName}
          </Text>
          <DropdownMenu.Root>
            <DropdownMenu.Trigger>
              <Button variant="soft">Beállítások</Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content>
              <DropdownMenu.Item
                onSelect={() => {
                  const next = i18n.language === 'hu' ? 'en' : 'hu';
                  localStorage.setItem('fonat.locale', next);
                  void i18n.changeLanguage(next);
                }}
              >
                {i18n.language === 'hu' ? 'English' : 'Magyar'}
              </DropdownMenu.Item>
              <DropdownMenu.Separator />
              <DropdownMenu.Item color="red" onSelect={() => void logout()}>
                {t('logout')}
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        </div>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
