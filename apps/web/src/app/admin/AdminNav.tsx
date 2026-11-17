
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Music2,
  CirclePlus,
} from 'lucide-react';

const navigation = [
  {
    label: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    label: 'Manage Songs',
    href: '/admin/songs',
    icon: Music2,
  },
  {
    label: 'Publish Song',
    href: '/admin/songs/new',
    icon: CirclePlus,
  },
];

export default function AdminNav() {
  const currentPath = usePathname() || '/admin';
  const pathname =
    currentPath.replace(/\/+$/, '') || '/';

  function isActive(href: string) {
    if (href === '/admin') {
      return pathname === '/admin';
    }

    if (href === '/admin/songs/new') {
      return (
        pathname === href ||
        pathname.startsWith(`${href}/`)
      );
    }

    if (href === '/admin/songs') {
      return (
        pathname.startsWith('/admin/songs') &&
        !pathname.startsWith('/admin/songs/new')
      );
    }

    return false;
  }

  return (
    <nav
      aria-label="Admin navigation"
      className="mt-7 gap-2 px-2 md:px-3"
      style={{
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {navigation.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            title={item.label}
            aria-current={active ? 'page' : undefined}
            className={`relative flex flex-col items-center gap-2 rounded-xl border px-2 py-3 text-center text-[10px] font-semibold transition-all duration-200 md:flex-row md:gap-3 md:px-4 md:text-left md:text-sm ${
              active
                ? 'border-[#D8B66C]/35 bg-[#D8B66C]/15 text-[#F2D99B] shadow-sm'
                : 'border-transparent text-white/65 hover:border-[#D8B66C]/20 hover:bg-white/[0.07] hover:text-white'
            }`}
          >
            {active && (
              <span className="absolute bottom-2 left-0 top-2 w-[3px] rounded-full bg-[#D8B66C]" />
            )}

            <Icon
              size={19}
              strokeWidth={active ? 2.3 : 1.8}
              className="shrink-0"
            />

            <span>{item.label}</span>

            {active && (
              <span className="ml-auto hidden h-1.5 w-1.5 rounded-full bg-[#D8B66C] md:block" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
