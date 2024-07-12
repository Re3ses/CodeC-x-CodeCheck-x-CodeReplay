import { getUser } from '@/lib/auth';
import Nav from '@/app/dashboard/nav';
import { redirect } from 'next/navigation';

export default async function LeaderboardsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
	if (user.auth === undefined) {
		redirect('/login');
	}
  return (
    <div>
      <Nav name={user?.auth.username} />
      {children}
    </div>
  );
}
