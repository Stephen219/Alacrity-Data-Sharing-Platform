"use client";
import React, { useState, useEffect } from "react";
import { Bell, Menu } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "./ui/button";
import { usePathname } from "next/navigation";

const getUserRole = (): "organisation" | "researcher" | null => {
  return "organisation"; // Simulated user role
};

type NavbarProps = {
  toggleSidebar: () => void;
};

const Navbar: React.FC<NavbarProps> = ({ toggleSidebar }) => {
  const userRole = getUserRole();
  const pathname = usePathname();
  const [isSignUpPage, setIsSignUpPage] = useState(false);

  useEffect(() => {
    setIsSignUpPage(pathname === "/auth/sign-up");
  }, [pathname]);

  return (
    <nav className="fixed top-0 left-0 w-full bg-white border-b border-gray-200 z-50 h-14">
      <div className="px-5 py-2 flex items-center justify-between">
        <div className="flex items-center">
          <button className="p-2 lg:hidden" onClick={toggleSidebar}>
            <Menu className="w-6 h-6" />
          </button>
          <Link href="/" className="text-lg font-bold text-black ml-2">
            ALACRITY
          </Link>
        </div>
        <div className="flex items-center space-x-3">
          <Link href="/" className={buttonVariants({ variant: "ghost" })}>
            Home
          </Link>
          <Link href="/" className={buttonVariants({ variant: "ghost" })}>
            About
          </Link>
          {userRole ? (
            <>
              <Link href="/account" className={buttonVariants({ variant: "ghost" })}>
                My Account
              </Link>
              <Bell className="w-5 h-5 text-primary hover:fill-primary" />
            </>
          ) : (
            <>
              <Link href="/auth/sign-in" className={buttonVariants({ variant: "ghost" })}>
                Sign In
              </Link>
              {!isSignUpPage && (
                <Link href="/auth/sign-up" className={buttonVariants({ variant: "default" })}>
                  Sign Up
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;