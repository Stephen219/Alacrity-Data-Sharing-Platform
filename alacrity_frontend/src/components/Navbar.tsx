"use client";
import React, { useState, useEffect } from "react";
import { Bell, Menu } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "./ui/button";
import { usePathname } from "next/navigation";
import { fetchUserData } from "@/libs/auth";
import { User } from "@/types/types";


import TopBarProfile from "./ui/TopbarProfile";





type NavbarProps = {
  toggleSidebar: () => void;
};

const Navbar: React.FC<NavbarProps> = ({ toggleSidebar }) => {
  const pathname = usePathname();
  const [isSignUpPage, setIsSignUpPage] = useState(false);
  const [user, setUser] = useState<User | null>(null);
 




  useEffect(() => {
    const getUserData = async () => {
      const userData = await fetchUserData();
      setUser(userData);
      console.log(userData);
    };


    getUserData();
  }, []);

  const getUserRole = (): "organization_admin" | "researcher" | 'contributor' | null => {
    if (user && (user.role === "organization_admin" || user.role === "researcher" || user.role === "contributor")) {
      return user.role;
    }
    return null;
  };


  const userRole = getUserRole();

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
          <Link href="#" className={buttonVariants({ variant: "ghost" })}>
            About
          </Link>
          {userRole ? (
            <div className="flex items-center space-x-3">
              <Bell className="w-5 h-5 text-primary hover:fill-primary" />
                {user && <TopBarProfile User={user} />}
            </div>

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