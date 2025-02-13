"use client";
import React from "react";
import NavItems from "./NavItems";

const getUserRole = (): "organisation" | "researcher" | null => {
  return "organisation"; // authentication needs to be implemented
};

type SidebarProps = {
  isOpen: boolean;
  toggleSidebar: () => void;
};

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
  const userRole = getUserRole();
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
        {userRole && <NavItems userRole={userRole} />}
      </nav>
    </aside>
  );
};

export default Sidebar;