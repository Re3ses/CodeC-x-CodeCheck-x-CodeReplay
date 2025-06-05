'use client';
import React from 'react';
import LoginForm from '@/components/ui/auth/loginForm';
import Link from 'next/link';

export default function Page() {
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center">
          <h1 className="text-5xl font-bold text-white">
            Code<span className="text-yellow-500">C</span>
          </h1>
          <p className="mt-2 text-white/60">Welcome back! Please login to your account.</p>
        </div>

        {/* Study Results Button */}
        <Link 
          href="/study-results" 
          className="block w-full p-4 bg-gray-800/50  rounded-xl
                   text-center text-white hover:bg-gray-700/50 transition-colors
                   "
        >
          <h3 className="text-lg font-semibold text-yellow-500">View Study Results</h3>
          <p className="mt-1 text-sm text-white/60">
            Explore the findings of our plagiarism detection research
          </p>
        </Link>

        {/* Login Form Card */}
        <div className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-xl shadow-2xl">
          <LoginForm />
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 w-full bg-gray-800/50 backdrop-blur-sm py-2 z-10">
        <div className="text-center text-sm text-white/50">
          © 2024 CodeC. All rights reserved. | AdNU
        </div>
      </div>
    </div>
  );
}
