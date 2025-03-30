"use client";

import React, { useEffect, useState } from 'react';
import { ShieldX } from 'lucide-react';
import Link from 'next/link';

export default function Forbidden403() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-orange-50 text-gray-900 p-4 overflow-hidden">
      <div className={`text-center transform ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'} transition-all duration-1000`}>
        <div className="relative">
          {/* Animated circles in the background */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-orange-100 rounded-full animate-ping opacity-20"></div>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-orange-200 rounded-full animate-pulse"></div>
          </div>
          
          {/* Icon with shake animation */}
          <div className={`mx-auto w-24 h-24 mb-6 text-orange-500 animate-[shake_0.5s_ease-in-out_infinite] ${mounted ? 'opacity-100' : 'opacity-0'} transition-opacity duration-1000 delay-500`}>
            <ShieldX size={96} strokeWidth={1.5} />
          </div>
          
          {/* 403 text with slide animation */}
          <h1 className={`text-8xl font-bold mb-4 text-orange-500 ${mounted ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'} transition-all duration-1000 delay-200`}>
            403
          </h1>
          
          {/* Message with fade animation */}
          <p className={`text-xl font-medium mb-8 ${mounted ? 'opacity-100' : 'opacity-0'} transition-opacity duration-1000 delay-700`}>
            NOT THIS TIME, ACCESS FORBIDDEN!
          </p>
          
          {/* Next.js Link with hover effects */}
          <Link
            href="/"
            className="relative inline-block px-8 py-3 bg-orange-500 text-white rounded-lg overflow-hidden group"
          >
            <span className="absolute w-full h-full bg-orange-600 left-0 top-0 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300 ease-out"></span>
            <span className="relative">Go Back Home</span>
          </Link>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
      `}</style>
    </div>
  );
}