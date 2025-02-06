"use client";

import { useState, useRef, useEffect } from "react";
import { NAV_ITEMS } from "@/components/config/index";
import NavItem from "./NavItem";
import { useOnClickOutside } from "@/hooks/use-on-click-outside";

export type UserRole = "organisation" | "researcher" | null;

interface NavItemsProps {
  userRole: UserRole; 
}

const NavItems: React.FC<NavItemsProps> = ({ userRole }) => {
  const [activeIndex, setActiveIndex] = useState<null | number>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveIndex(null);
      }
    };

    document.addEventListener("keydown", handler);

    return () => {
      document.removeEventListener("keydown", handler);
    };
  }, []);

  const isAnyOpen = activeIndex !== null;
const navRef = useRef<HTMLDivElement>(null);
useOnClickOutside(navRef as React.RefObject<HTMLElement>, () => setActiveIndex(null));

  // Filter tools based on role
  const filteredCategories = NAV_ITEMS.filter((category) =>
    category.roles.includes(userRole ?? "")
  );

  return (
    <div className="flex gap-3 h-full" ref={navRef}>
      {filteredCategories.map((tools, i) => {
        const handleOpen = () => {
          setActiveIndex(activeIndex === i ? null : i);
        };

        return (
          <NavItem
            key={tools.value}
            tools={tools}
            handleOpen={handleOpen}
            isOpen={i === activeIndex}
            isAnyOpen={isAnyOpen}
          />
        );
      })}
    </div>
  );
};

export default NavItems;
