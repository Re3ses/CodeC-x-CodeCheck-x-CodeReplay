import Nav from '@/app/dashboard/nav';

export default async function Layout({ children }: { children: React.ReactNode }) {
    return (
        <div>
            {children}
        </div>
    );
}