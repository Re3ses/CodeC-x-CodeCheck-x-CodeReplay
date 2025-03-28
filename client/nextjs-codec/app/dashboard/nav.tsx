'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Code2,
  Trophy,
  Shield,
} from 'lucide-react';

export default function Nav(props: { variant?: string; name?: string; type?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const path = props.type?.toLowerCase();

  // Navigation links; Code Room should be disabled when active (i.e. already on that route)
  const navLinks = [
    { id: 'coderoom', label: 'Code Room', href: `/${path}/coderoom`, icon: Code2 },
    // { id: 'codebox', label: 'Code Box', href: `/codebox`, icon: Box },
    // { id: 'leaderboards', label: 'Leaderboards', href: '/leaderboards?page=1&perPage=10', icon: Trophy },
    // { id: 'codeReplay', label: 'CodeCheck', href: `/codereplay`, icon: Shield },
    // { id: 'codeReplayV3', label: 'CodeReplay', href: `/codereplayV3`, icon: Play },
    // { id: 'highlighting', label: 'Highlighting', href: `/highlighting`, icon: Highlighter },
    { id: 'attention', label: 'Attention', href: `/attention`, icon: Shield },
    { id: 'ir-plag', label: 'IR-Plag', href: `/ir-plag`, icon: Shield },
    { id: 'visualizer', label: 'Visualizer', href: `/visualizer`, icon: Shield },

  ];

  const handleNavigation = (href: string) => {
    router.push(href);
  };

  return (
    <nav className="flex items-center justify-between px-6 py-3 bg-card text-white bg-gray-900 border-b border-white/10">
      {/* Logo text on the left */}
      <div className="flex items-center gap-10">
        <Link href="/dashboard" className="flex items-center">
          <span className="text-2xl font-bold">
            Code
            <span className="text-yellow-500">C</span>
          </span>
        </Link>

        {/* Navigation Links */}
        <div className="flex gap-6">
          {navLinks.map(({ label, href, id, icon: Icon, disabled }) => (
            <button
              key={id}
              onClick={() => !disabled && handleNavigation(href)}
              disabled={disabled}
              className={`flex items-center gap-2 text-sm font-medium transition-colors relative 
                ${disabled ? 'text-yellow-500 cursor-not-allowed' : 'text-white hover:text-yellow-500'}`}
            >
              <Icon className={`w-5 h-5 ${disabled ? 'text-yellow-500' : 'text-yellow-500'}`} />
              {label}
              {disabled && (
                <span className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs bg-gray-800 text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity group-hover:block">
                  Loading...
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Profile Section with Avatar */}
      <Link href="/dashboard/profile" className="flex items-center gap-2">
        <Avatar className="h-8 w-8">
          <AvatarImage src="" alt={props.name} />
          <AvatarFallback className="bg-yellow-500 text-black">
            {props.name?.charAt(0)?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </Link>
    </nav>
  );
}