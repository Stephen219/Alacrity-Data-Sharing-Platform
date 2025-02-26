
"use client";
import React, {  useEffect, useState } from "react";
import NavItems from "./NavItems";
import { fetchUserData } from "@/libs/auth";

type UserRole = "organization_admin" | "researcher"| "contributor" | null;

type SidebarProps = {
  isOpen: boolean;
  toggleSidebar: () => void;
};

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRole = async () => {
      try {
        const userData = await fetchUserData();
        if (userData && (userData.role === "organization_admin" || userData.role === "contributor" ||
          userData.role === "researcher") ) {
          setUserRole(userData.role);
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRole();
  }, []); 
  return (
    <aside
      className={`fixed left-0 top-0 h-full w-40 bg-white shadow-md transition-transform duration-300 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } lg:translate-x-0 lg:w-52 p-4 overflow-y-auto flex flex-col z-50`}
    >
      <div className="pb-4 mb-4">
        <p className="text-lg font-bold text-black">ALACRITY</p>
        <button onClick={toggleSidebar}></button>
      </div>
      <nav className="flex flex-col space-y-4">
        {isLoading ? (
          <div>Loading...</div>
        ) : (
          userRole && <NavItems userRole={userRole} />
        )}
      </nav>
    </aside>
  );
};

export default Sidebar;