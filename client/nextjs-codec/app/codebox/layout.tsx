import React from 'react';
import Nav from '../dashboard/nav';

export default function layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-screen">
      <Nav />
      {children}
    </div>
  );
}
