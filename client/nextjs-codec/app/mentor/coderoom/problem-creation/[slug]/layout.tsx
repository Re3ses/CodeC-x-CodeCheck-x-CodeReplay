'use client';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { getUser } from '@/lib/auth';
import { useQuery } from '@tanstack/react-query';
import { FormEventHandler } from 'react';

export default function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { slug: string };
}) {
  const user = useQuery({
    queryKey: ['user'],
    queryFn: async () => await getUser(),
  });
  console.log(user.data, params?.slug);

  const url = `${user.data?.type.toLowerCase()}/coderoom/problem-creation/${params?.slug}`;

  return (
    <div className="flex h-screen flex-col mx-[270px] my-5 gap-5">
      {children}
    </div>
  );
}
