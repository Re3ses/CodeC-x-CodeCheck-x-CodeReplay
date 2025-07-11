import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import './globals.css';
import ReactQueryProvider from '@/components/providers/ReactQueryProvider';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import { ThemeProvider } from '@/components/providers/ThemeProvider';

const poppins = Poppins({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-poppins',
});

export const metadata: Metadata = {
  title: 'CodeC',
  description: 'The place where you can code',
  icons: {
    icon: '/favicon.ico',
    shortcut: ['/favicon.ico'],
    apple: [
      {
        url: '/icon.png',
        sizes: '512x512',
        type: 'image/png',
      }
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={poppins.variable}>
      <ReactQueryProvider>
        <body
          className={cn(
            'min-h-screen bg-background font-sans antialiased'
          )}
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster />
          </ThemeProvider>
        </body>
        <ReactQueryDevtools initialIsOpen={false} />
      </ReactQueryProvider>
    </html>
  );
}
