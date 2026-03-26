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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Verificando acceso...</p>
      </div>
    );
  }

  function isActive(href: string) {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-[220px] shrink-0 bg-white border-r border-gray-200 flex flex-col fixed inset-y-0 left-0 z-10">
        {/* Brand */}
        <div className="h-14 flex items-center px-5 border-b border-gray-100">
          <span className="font-bold text-blue-600 text-base tracking-tight">Escobita Admin</span>
        </div>

        {/* Nav links */}
        <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
          {NAV_LINKS.map(({ label, icon: Icon, href }) => (
            (user.role === 'admin' || (href !== '/admin/config' && href !== '/admin/users')) && (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive(href)
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            )
          ))}

          <div className="my-2 border-t border-gray-100" />

          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            <ExternalLink className="h-4 w-4 shrink-0" />
            Ver simulador
          </a>
        </nav>

        {/* User + logout */}
        <div className="border-t border-gray-100 p-4">
          <p className="text-sm font-medium text-gray-800 truncate">{user.name}</p>
          <span className="inline-block mt-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
            {user.role}
          </span>
          <button
            onClick={() => { logout(); router.push('/login'); }}
            className="mt-3 flex items-center gap-2 text-sm text-red-600 hover:text-red-800 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 ml-[220px] min-h-screen">
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}
