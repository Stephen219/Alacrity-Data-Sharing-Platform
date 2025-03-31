import React from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function About() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-16 px-6">
      <div className="max-w-3xl text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
          About <span className="text-orange-600">Alacrity</span>
        </h1>
        <p className="text-lg text-gray-600 mb-8 leading-relaxed">
          Alacrity is a platform designed to accelerate data-driven innovation. We connect organizations with researchers, providing tools to upload, manage, and analyze datasets securely and efficiently. Our mission is to make collaboration seamless, data accessible, and insights actionable.
        </p>
        <p className="text-lg text-gray-600 mb-8 leading-relaxed">
          Whether you’re an organization looking to share datasets or a researcher seeking to explore new data, Alacrity empowers you with advanced security, built-in analytics, and a user-friendly experience. Join us to transform how data shapes the future.
        </p>
        <div className="flex justify-center gap-6">
          <Link
            href="/auth/sign-up/org-sign-up"
            className={buttonVariants({
              size: "lg",
              className: "bg-orange-600 text-white hover:bg-orange-700",
            })}
          >
            Organisation Sign Up
          </Link>
          <Link
            href="/auth/sign-up"
            className={buttonVariants({
              size: "lg",
              className: "bg-orange-600 text-white hover:bg-orange-700",
            })}
          >
            Researcher Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}