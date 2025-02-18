'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { revalidatePath } from 'next/cache';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Code2,
  Box,
  Trophy,
  Shield,
  Play,
  Highlighter,
} from 'lucide-react';

export default function Nav(props: { variant?: string; name?: string; type?: string }) {
  const pathname = usePathname();
  const path = props.type?.toLowerCase();

  const navLinks = [
    { id: 'coderoom', label: 'Code Room', href: `/${path}/coderoom`, icon: Code2 },
    { id: 'codebox', label: 'Code Box', href: `/codebox`, icon: Box },
    // { id: 'leaderboards', label: 'Leaderboards', href: '/leaderboards?page=1&perPage=10', icon: Trophy },
    { id: 'codeReplay', label: 'CodeCheck', href: `/codereplay`, icon: Shield },
    // { id: 'codeReplayV3', label: 'CodeReplay', href: `/codereplayV3`, icon: Play },
    // { id: 'highlighting', label: 'Highlighting', href: `/highlighting`, icon: Highlighter },
  ];

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
          {navLinks.map(({ label, href, id, icon: Icon }) => (
            <Link
              key={id}
              href={href}
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                pathname.endsWith(id) ? 'text-yellow-500' : 'text-white hover:text-yellow-500'
              }`}
              onClick={() => revalidatePath(href)}
            >
              <Icon className="w-5 h-5 text-yellow-500" />
              {label}
            </Link>
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