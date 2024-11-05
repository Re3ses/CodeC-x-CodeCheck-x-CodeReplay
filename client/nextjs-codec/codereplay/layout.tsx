export default function CodeReplayLayout({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return (
      <div className="w-full min-h-screen bg-white">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </div>
    );
  }