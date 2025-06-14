import Nav from '@/app/dashboard/nav';
import { getUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function Layout({ children }: { children: React.ReactNode }) {
    const user = await getUser();
    if (user.auth === undefined) {
        redirect('/login');
    }
    return (
        <div>
            <Nav name={user?.auth.username} type={user?.type} />
            {children}
        </div>
    );
}