'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useWorkspace } from '@/contexts/WorkspaceContext';

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

function NavLink({ href, children, className }: NavLinkProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { currentWorkspace } = useWorkspace();

  // Build URL with workspace parameter if one is selected
  const buildUrl = () => {
    if (!currentWorkspace) return href;

    const url = new URL(href, window.location.origin);

    // Only add workspace param to pages that support it
    const supportsWorkspace = ['/profiles', '/posts', '/', '/news'].includes(href);

    if (supportsWorkspace) {
      url.searchParams.set('workspace', currentWorkspace.id.toString());
    }

    return `${url.pathname}${url.search}`;
  };

  const isActive = pathname === href;

  return (
    <Link
      href={buildUrl()}
      className={`${className} ${
        isActive ? 'text-gray-900' : 'text-gray-600 hover:text-gray-900'
      } font-medium transition-colors`}
    >
      {children}
    </Link>
  );
}

export default function WorkspaceAwareNav() {
  return (
    <nav className="hidden md:flex space-x-6">
      <NavLink href="/">Dashboard</NavLink>
      <NavLink href="/posts">All Posts</NavLink>
      <NavLink href="/profiles">Profiles</NavLink>
      <NavLink href="/companies">🏢 Companies</NavLink>
      <NavLink href="/news">📰 News</NavLink>
      <NavLink href="/topics">🎯 Topics</NavLink>
      <NavLink href="/workspaces">Workspaces</NavLink>
      <NavLink href="/intelligence">🤖 AI Intelligence</NavLink>
      <NavLink href="/search">🧠 Search</NavLink>
    </nav>
  );
}
