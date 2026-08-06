'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, ListTodo, KanbanSquare, CalendarDays, Building2, IdCard, Users, Bell, BarChart3, User as UserIcon, Settings as SettingsIcon, ScrollText, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { usePermission } from '@/hooks/use-permission';
import { Avatar } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/tasks', label: 'Tasks', icon: ListTodo, module: 'tasks', action: 'view' },
  { href: '/tasks/kanban', label: 'Kanban', icon: KanbanSquare, module: 'tasks', action: 'view' },
  { href: '/tasks/calendar', label: 'Calendar', icon: CalendarDays, module: 'tasks', action: 'view' },
  { href: '/departments', label: 'Departments', icon: Building2, module: 'departments', action: 'view' },
  { href: '/positions', label: 'Positions', icon: IdCard, module: 'positions', action: 'view' },
  { href: '/users', label: 'Users', icon: Users, module: 'users', action: 'view' },
  { href: '/notifications', label: 'Notifications', icon: Bell },
  { href: '/reports', label: 'Reports', icon: BarChart3, module: 'reports', action: 'view' },
  { href: '/audit-logs', label: 'Audit Logs', icon: ScrollText, module: 'activity-logs', action: 'view' },
  { href: '/settings', label: 'Settings', icon: SettingsIcon, module: 'settings', action: 'view' },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { can } = usePermission();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="flex min-h-screen bg-muted">
      <aside className="w-60 flex-none bg-primary flex flex-col">
        <div className="flex items-center gap-2.5 px-4 py-4 border-b border-white/10">
          <div className="h-8 w-8 rounded-md bg-white/10" />
          <span className="text-sm font-medium text-white">Abraj Al Yasir</span>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 flex flex-col gap-0.5">
          {NAV.filter((n) => !n.module || can(n.module, n.action!)).map((n) => {
            const active = pathname === n.href || (n.href !== '/dashboard' && pathname.startsWith(n.href));
            return (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  'flex items-center gap-2.5 rounded-md px-3 py-2 text-xs font-medium text-white/70 hover:bg-white/10 hover:text-white',
                  active && 'bg-white/10 text-white',
                )}
              >
                <n.icon className="h-4 w-4" />
                {n.label}
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
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-14 flex-none bg-white border-b border-input flex items-center gap-3 px-5">
          <div className="flex-1" />
          <Link href="/profile" className="text-xs font-medium text-muted-foreground hover:text-foreground">Profile</Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button><Avatar name={user?.full_name ?? '?'} size={30} /></button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => router.push('/profile')}>
                <UserIcon className="h-3.5 w-3.5 mr-2" /> My Profile
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={logout} className="text-destructive">
                <LogOut className="h-3.5 w-3.5 mr-2" /> Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
