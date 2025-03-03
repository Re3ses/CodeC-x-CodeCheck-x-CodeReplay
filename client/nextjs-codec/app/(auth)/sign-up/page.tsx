'use client';
import React from 'react';
import RegisterForm from '@/components/ui/auth/registerForm';
import Image from 'next/image';

const IsometricIllustration = () => (
  <svg viewBox="0 0 400 300" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
    <path d="M200,250 L350,150 L350,50 L200,150 Z" fill="#fbbf24" opacity="0.2" />
    <path d="M50,150 L200,250 L200,150 L50,50 Z" fill="#fbbf24" opacity="0.1" />
    <rect x="150" y="100" width="100" height="150" fill="#fbbf24" opacity="0.15" />
    <circle cx="200" cy="120" r="30" fill="#fbbf24" opacity="0.2" />
  </svg>
);

export default function Page() {
  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Left Section - Sign Up Form (smaller) */}
      <div className="w-full lg:w-3/5 flex flex-col justify-center items-center p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <div className="text-center">
            <h1 className="text-5xl font-bold text-white">
              Code<span className="text-yellow-500">C</span>
            </h1>
            <p className="mt-2 text-white/60">Create your account to get started</p>
          </div>

          {/* Sign Up Form Card */}
          <div className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-xl shadow-2xl">
            <RegisterForm />
          </div>
        </div>
      </div>

      {/* Right Section - Illustration (larger) */}
      <div className="hidden lg:flex w-3/5 bg-gray-800 relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center p-12">
          {/* Container for 3:4 aspect ratio */}
          <div className="relative w-full max-w-3xl aspect-[3/4]">
            {/* Decorative blobs */}
            <div className="absolute top-0 -left-4 w-96 h-96 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob"></div>
            <div className="absolute top-0 -right-4 w-96 h-96 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-8 left-20 w-96 h-96 bg-white rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob animation-delay-4000"></div>

            {/* Placeholder for actual image */}
            <div className="relative w-full h-full">
              {/* You can replace this with your actual image */}
              <IsometricIllustration />
            </div>
          </div>
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
