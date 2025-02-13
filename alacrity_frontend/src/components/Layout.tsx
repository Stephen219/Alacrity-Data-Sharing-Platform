"use client";
import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

type LayoutProps = {
  children: React.ReactNode;
};

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  useEffect(() => {
    setMounted(true);
  }, []);

  const noNavPaths: string[] = ["/auth/sign-in", "/auth/sign-up", "/auth/forgot-password"];
  const hideSidebarPaths: string[] = ["/"];

  if (!mounted) {
    return null; 
  }

  const shouldShowNav = !noNavPaths.includes(pathname);
  const shouldShowSidebar = !hideSidebarPaths.includes(pathname);

  if (!shouldShowNav) {
    return <main className="min-h-screen">{children}</main>;
  }

  return (
    <div className="min-h-screen">
      {shouldShowSidebar && <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />}
      <Navbar toggleSidebar={toggleSidebar} />
      <main className={shouldShowSidebar ? "lg:ml-40 mt-14" : "mt-14"}>
        <div className="max-w-5xl mx-auto px-4">{children}</div>
      </main>
    </div>
  );
};

export default Layout;
