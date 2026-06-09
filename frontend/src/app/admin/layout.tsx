'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  BookOpen,
  Database,
  ClipboardList,
  BarChart3,
  Settings,
  ExternalLink,
  LogOut,
  Users,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/ui/logo';

const NAV_LINKS = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/admin' },
  { label: 'Simuladores', icon: BookOpen, href: '/admin/exams' },
  { label: 'Banco de preguntas', icon: Database, href: '/admin/questions' },
  { label: 'Intentos', icon: ClipboardList, href: '/admin/attempts' },
  { label: 'Estadísticas', icon: BarChart3, href: '/admin/analytics' },
  { label: 'Usuarios', icon: Users, href: '/admin/users' },
  { label: 'Configuración', icon: Settings, href: '/admin/config' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, token, logout } = useAuthStore();

  useEffect(() => {
    if (!token || !user || !['admin', 'editor'].includes(user.role)) {
      router.replace('/login');
    }
  }, [token, user, router]);

  if (!token || !user || !['admin', 'editor'].includes(user.role)) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500">Verificando acceso…</p>
      </div>
    );
  }

  function isActive(href: string) {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar */}
      <aside className="w-[244px] shrink-0 bg-white border-r border-slate-200/80 flex flex-col fixed inset-y-0 left-0 z-10">
        {/* Brand */}
        <div className="h-16 flex items-center px-5 border-b border-slate-100">
          <Link href="/admin">
            <Logo subtitle="Admin" />
          </Link>
        </div>

        {/* Nav links */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {NAV_LINKS.map(({ label, icon: Icon, href }) => (
            (user.role === 'admin' || (href !== '/admin/config' && href !== '/admin/users')) && (
              <Link
                key={href}
                href={href}
                className={cn(
                  'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                  isActive(href)
                    ? 'bg-brand-50 text-brand-800'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900',
                )}
              >
                {isActive(href) && (
                  <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-brand-700" />
                )}
                <Icon className={cn('h-[18px] w-[18px] shrink-0 transition-colors', isActive(href) ? 'text-brand-700' : 'text-slate-400 group-hover:text-slate-600')} />
                {label}
              </Link>
            )
          ))}

          <div className="my-3 border-t border-slate-100" />

          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all"
          >
            <ExternalLink className="h-[18px] w-[18px] shrink-0 text-slate-400 group-hover:text-slate-600" />
            Ver simulador
          </a>
        </nav>

        {/* User + logout */}
        <div className="border-t border-slate-100 p-3">
          <div className="flex items-center gap-3 rounded-xl px-2 py-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-700 text-sm font-bold text-white">
              {(user.name ?? 'A').charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-800">{user.name}</p>
              <span className="text-xs font-medium capitalize text-success-600">{user.role}</span>
            </div>
          </div>
          <button
            onClick={() => { logout(); router.push('/login'); }}
            className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-danger-50 hover:text-danger-600"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 ml-[244px] min-h-screen">
        <main className="p-6 sm:p-8 max-w-7xl">{children}</main>
      </div>
    </div>
  );
}
