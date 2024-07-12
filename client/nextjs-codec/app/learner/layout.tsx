import { SocketProvider } from '@/context/socket';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SocketProvider>
      <section>{children}</section>
    </SocketProvider>
  );
}
