"use client";

import React from "react";
import Link from "next/link";

export default function Forbidden403() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white text-gray-900 p-4">
      <div className="text-center">
    
        
        <h1 className="text-8xl font-bold mb-4 text-[#f97316]">403</h1>

        
        <p className="text-xl font-medium mb-8">
          NOT THIS TIME, ACCESS FORBIDDEN!
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-[#f97316] text-white rounded-lg hover:bg-[#5A94D1] transition-colors shadow-md hover:shadow-lg"
        >
          Go Back Home
        </Link>
      </div>
    </div>
  );
}