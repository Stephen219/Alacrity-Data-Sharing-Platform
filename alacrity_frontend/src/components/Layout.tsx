"use client";
import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { fetchUserData } from "@/libs/auth";
import { User } from "@/types/types";
import Footer from "./Footer";

type LayoutProps = {
  children: React.ReactNode;
};

const Layout: React.FC<LayoutProps> = ({ children }) => {






  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const [user, setUser] = useState<User | null>(null);


  // FIXME:   FIX THIS FOR THE SIDEBAR BEST DONE BY USING GROUPS
    // Technically, I’m trying to ensure the sidebar never renders when no one is logged in.
    // This approach feels like overkill, but I’ll leave it for now because restructuring 
    // requires team consent.
    // Why? `usePathname` cannot detect 404 errors as routes 
    // since it returns the requested path (e.g., "/random-not-found-page") 
    // instead of the 404 state triggered by `not-found.tsx`. 
    // This makes it unreliable for excluding 404 pages and other client-detected errors 
    // ., those thrown server COMPONENTS but handled by client camponents from the base layout. 
    // A cleaner solution would be using route groups 
    // to separate public and private routes, excluding public routes (like 404s) 
    // from inheriting the sidebar, avoiding layout inheritance issues.
  useEffect(() => {
    setMounted(true);
  }, []);
      useEffect(() => {
        const getUserData = async () => {
          const userData: User | null = await fetchUserData();
          if (userData) {
            setUser(userData);
          }
        };
    
        getUserData();
      }, []);
    
      const autheticated = (): boolean => {
        if (user) {
          return true;
        }
        return false;
      };
    
    
  const isAuthenticated = autheticated();
  const noNavPaths: string[] = ["/auth/sign-in", "/auth/sign-up", "/auth/forgot-password", "/auth/reset-password", "/not-found"];
  const hideSidebarPaths: string[] = ["/"];

  if (!mounted) {
    return null; 
  }

  const shouldShowNav = !noNavPaths.includes(pathname);
  const shouldShowSidebar = !hideSidebarPaths.includes(pathname) && isAuthenticated;

  if (!shouldShowNav) {
    return <main className="min-h-screen">{children}</main>;
  }

  return (
    <>
    <div className="min-h-screen">
      {shouldShowSidebar && <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />}
      <Navbar toggleSidebar={toggleSidebar} />
      <main className={shouldShowSidebar ? "lg:ml-40 mt-14" : "mt-14"}>
        <div className="max-w-5xl mx-auto px-4">{children}</div>
      </main>
    </div>
    <div>
    <hr className="h-px bg-gray-200 border-0 dark:bg-gray-700"></hr>
    <div className="mx-48 min-w-screen">
    <Footer/>
    </div>
    </div>
    </>
  );
};

export default Layout;
