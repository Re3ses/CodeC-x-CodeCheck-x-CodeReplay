'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import {
  Code2,
  Trophy,
  Shield,
  Database,  // for IR-Plag (represents dataset)
  Network,  // for Visualizer (represents visualization)
  BarChart2,  // Add this import for the new icon
} from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Nav(props: { variant?: string; name?: string; type?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const path = props.type?.toLowerCase();
  const [canGoBack, setCanGoBack] = useState(false);

  // Navigation links; Code Room should be disabled when active (i.e. already on that route)
  const navLinks = [
    { id: 'coderoom', label: 'Code Room', href: `/${path}/coderoom`, icon: Code2 },
    // { id: 'codebox', label: 'Code Box', href: `/codebox`, icon: Box },
    // { id: 'leaderboards', label: 'Leaderboards', href: '/leaderboards?page=1&perPage=10', icon: Trophy },
    { id: 'ir-plag', label: 'IR-Plag', href: `/ir-plag`, icon: Database },
    { id: 'visualizer', label: 'Visualizer', href: `/visualizer`, icon: Network },
    { id: 'agreement', label: 'Agreement Analysis', href: `/agreement`, icon: BarChart2 }, // Add this line
  ];

  const handleNavigation = (href: string) => {
    router.push(href);
  };


  useEffect(() => {
    setCanGoBack(window.history.length > 1);
  }, [])


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
          {path && (navLinks.map(({ label, href, id, icon: Icon, disabled }) => (
            <AnimatePresence key={id}>
              <motion.button
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
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
              </motion.button>
            </AnimatePresence>
          )))}
        </div>
      </div>

      {/* Profile Section with Avatar */}
      <div className='flex items-center gap-4'>
        {!(canGoBack && pathname === "/dashboard") && (
          <button onClick={() => router.back()}
            className="h-9 rounded-md pl-2 pr-4 border border-input bg-background text-white/40 hover:bg-violet-600/30 hover:text-accent-foreground inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50">
            <ChevronLeft /> Back
          </button>
        )
        }
        <Link href="/dashboard/profile" className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src="" alt={props.name} />
            <AvatarFallback className="bg-yellow-500 text-black">
              {props.name?.charAt(0)?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Link>
      </div >
    </nav >
  );
}