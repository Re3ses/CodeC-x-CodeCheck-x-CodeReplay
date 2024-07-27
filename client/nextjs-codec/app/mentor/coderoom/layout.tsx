import Nav from '@/app/dashboard/nav';
import { getUser } from '@/lib/auth';

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  return (
    <div className="flex h-screen flex-col">
      <Nav name={user?.auth.username} type={user?.type} />
      {children}
    </div>
  );
}
