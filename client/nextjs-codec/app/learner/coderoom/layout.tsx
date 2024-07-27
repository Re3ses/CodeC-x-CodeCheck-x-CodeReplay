import { getUser } from '@/lib/auth';
import Nav from '@/app/dashboard/nav';

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  console.log(user)
  return (
    <div className="flex flex-col h-[100vh]">
      <Nav name={user?.auth.username} type={user?.type} />
      {children}
    </div>
  );
}
