'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, ListTodo, KanbanSquare, CalendarDays, Building2, IdCard, Users, ShieldCheck, Bell, BarChart3, User as UserIcon, Settings as SettingsIcon, ScrollText, FolderOpen, LogOut, Menu, X, Languages } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { usePermission } from '@/hooks/use-permission';
import { useLocale } from '@/lib/i18n/locale-context';
import { Avatar } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/dashboard', key: 'nav.dashboard', icon: LayoutDashboard },
  { href: '/tasks', key: 'nav.tasks', icon: ListTodo, module: 'tasks', action: 'view' },
  { href: '/tasks/kanban', key: 'nav.kanban', icon: KanbanSquare, module: 'tasks', action: 'view' },
  { href: '/tasks/calendar', key: 'nav.calendar', icon: CalendarDays, module: 'tasks', action: 'view' },
  { href: '/departments', key: 'nav.departments', icon: Building2, module: 'departments', action: 'view' },
  { href: '/positions', key: 'nav.positions', icon: IdCard, module: 'positions', action: 'view' },
  { href: '/users', key: 'nav.users', icon: Users, module: 'users', action: 'view' },
  { href: '/roles', key: 'nav.roles', icon: ShieldCheck, module: 'roles', action: 'view' },
  { href: '/notifications', key: 'nav.notifications', icon: Bell },
  { href: '/reports', key: 'nav.reports', icon: BarChart3, module: 'reports', action: 'view' },
  { href: '/files', key: 'nav.files', icon: FolderOpen, module: 'attachments', action: 'view' },
  { href: '/audit-logs', key: 'nav.auditLogs', icon: ScrollText, module: 'activity-logs', action: 'view' },
  { href: '/settings', key: 'nav.settings', icon: SettingsIcon, module: 'settings', action: 'view' },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { can } = usePermission();
  const { locale, setLocale, t } = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const items = NAV.filter((n) => !n.module || can(n.module, n.action!));

  const sidebarContent = (
    <>
      <div className="flex items-center justify-between gap-2.5 px-4 py-4 border-b border-white/10">
        <Link href="/dashboard" className="flex items-center gap-2.5" onClick={() => setMobileOpen(false)}>
          <img src="/logo-icon.png" alt="Abraj Al Yasir" className="h-9 w-auto" />
          <span className="text-sm font-medium text-white">Abraj Al Yasir</span>
        </Link>
        <button className="lg:hidden text-white/70" onClick={() => setMobileOpen(false)} aria-label="Close menu">
          <X className="h-5 w-5" />
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto p-3 flex flex-col gap-0.5">
        {items.map((n) => {
          const active = pathname === n.href || (n.href !== '/dashboard' && pathname.startsWith(n.href));
          return (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-2.5 rounded-md px-3 py-2 text-xs font-medium text-white/70 hover:bg-white/10 hover:text-white',
                active && 'bg-white/10 text-white',
              )}
            >
              <n.icon className="h-4 w-4 flex-none" />
              {t(n.key)}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-white/10 flex items-center gap-2">
        <Avatar name={user?.full_name ?? '?'} size={30} />
        <div className="min-w-0 flex-1">
          <div className="text-xs font-medium text-white truncate">{user?.full_name}</div>
          <div className="text-[10px] text-white/50 truncate">{user?.role?.name}</div>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-muted">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 flex-none bg-primary flex-col">{sidebarContent}</aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="relative z-50 w-64 max-w-[80vw] flex-none bg-primary flex flex-col">{sidebarContent}</aside>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-14 flex-none bg-white border-b border-input flex items-center gap-2 px-4 lg:px-5">
          <button className="lg:hidden text-foreground" onClick={() => setMobileOpen(true)} aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1" />
          <button
            className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
            onClick={() => setLocale(locale === 'ar' ? 'en' : 'ar')}
            title={locale === 'ar' ? 'English' : 'العربية'}
          >
            <Languages className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{locale === 'ar' ? 'English' : 'العربية'}</span>
          </button>
          <Link href="/profile" className="hidden sm:inline text-xs font-medium text-muted-foreground hover:text-foreground">
            {t('nav.myProfile')}
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button><Avatar name={user?.full_name ?? '?'} size={30} /></button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => router.push('/profile')}>
                <UserIcon className="h-3.5 w-3.5 me-2" /> {t('nav.myProfile')}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={logout} className="text-destructive">
                <LogOut className="h-3.5 w-3.5 me-2" /> {t('common.signOut')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
