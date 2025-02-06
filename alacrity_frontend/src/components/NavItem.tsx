import { ChevronDown } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef } from "react";

interface FeaturedItem {
  name: string;
  href: string;
  imageSrc: string;
}

interface NavItemProps {
  tools: {
    label: string;
    value: string;
    roles: string[];
    featured: FeaturedItem[];
  };
  handleOpen: () => void;
  isOpen: boolean;
  isAnyOpen: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ handleOpen, isOpen, tools }) => {
  const [isScrollable, setIsScrollable] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkScrollable = () => {
      if (dropdownRef.current) {
        setIsScrollable(dropdownRef.current.scrollHeight > window.innerHeight * 0.8);
      }
    };

    if (isOpen) {
      checkScrollable();
      window.addEventListener("resize", checkScrollable);
    }

    return () => window.removeEventListener("resize", checkScrollable);
  }, [isOpen, tools.featured.length]);

  return (
    <div className="relative flex items-center">
      {/* Dropdown Trigger Button */}
      <Button
        className="flex items-center gap-1.5 transition-all duration-300 hover:bg-secondary px-4 py-2 rounded-lg"
        onClick={handleOpen}
        variant={isOpen ? "secondary" : "ghost"}
      >
        {tools.label}
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </motion.div>
      </Button>

      {/* Animated Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className={cn(
              "absolute left-0 top-full mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200",
              isScrollable ? "max-h-[80vh] overflow-y-auto scrollbar-custom" : "overflow-visible"
            )}
          >
            <div className="p-4 grid gap-4">
              {tools.featured.map(({ name, href, imageSrc }) => (
                <Link key={name} href={href} className="group block">
                  <div className="relative aspect-video overflow-hidden rounded-lg border transition-all duration-300 group-hover:border-black">
                    <Image src={imageSrc} alt={name} fill className="object-cover object-center" />
                  </div>
                  <span className="mt-2 block text-center font-medium text-black transition-colors">
                    {name}
                  </span>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NavItem;