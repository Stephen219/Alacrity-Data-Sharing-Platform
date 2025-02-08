"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";

//hides navbar in auth pages 
const ConditionalNavbar = () => {
  const pathname = usePathname();
  const showNavbar = !pathname.startsWith("/auth");

  return showNavbar ? <Navbar /> : null;
};

export default ConditionalNavbar;
