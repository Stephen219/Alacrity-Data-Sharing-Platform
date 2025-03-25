"use client";
import React, { useState, useEffect } from "react";
import { Bell, Menu, X } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "./ui/button";
import { usePathname } from "next/navigation";
import { fetchUserData } from "@/libs/auth";
import { User } from "@/types/types";
import { BACKEND_URL } from "@/config"
import { fetchWithAuth } from "@/libs/auth";
import TopBarProfile from "./ui/TopbarProfile";
import { ModeToggle } from "./ui/ModeToggle";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

interface NotificationItem {
  id: string;
  message: string;
  is_read: boolean;
  created_at: string;
  link?: string; 
}

type NavbarProps = {
  toggleSidebar: () => void;
};



const Navbar: React.FC<NavbarProps> = ({ toggleSidebar }) => {
  const pathname = usePathname();
  const [isSignUpPage, setIsSignUpPage] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [notificationCount, setNotificationCount] = useState<number>(0); //stores unread notif count
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // fetches unread count
  async function fetchNotificationCount(): Promise<number> {
    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/notifications/count/`, { method: "GET" });
      if (!res.ok) {
        console.error("Failed to fetch notification count");
        return 0;
      }
      const data = await res.json();
      return data.count ?? 0;
    } catch (error) {
      console.error("Error fetching notification count:", error);
      return 0;
    }
  }

  // fetches full list
  async function fetchNotificationList() {
    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/notifications/list/`, { method: "GET" });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      } else {
        console.error("Failed to fetch notification list");
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  }

  // Marks all as read
  async function markAllRead() {
    try {
      const res = await fetchWithAuth(
        `${BACKEND_URL}/notifications/mark_all_read/`,
        { method: "PATCH" }
      );
      if (!res.ok) {
        console.error("Failed to mark all read");
        return;
      }
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setNotificationCount(0); // badge goes away
    } catch (error) {
      console.error("Error marking all read:", error);
    }
  }

  //  deletes a single notification so log can be cleared
  async function deleteNotification(notifId: string) {
    try {
      const res = await fetchWithAuth(
        `${BACKEND_URL}/notifications/${notifId}/delete/`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        console.error("Failed to delete notification");
        return;
      }

      setNotifications((prev) => prev.filter((n) => n.id !== notifId));
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  }
  

  // On mount: fetch user & unread count
  useEffect(() => {
    const getUserData = async () => {
      const userData = await fetchUserData();
      if (userData) {
        setUser(userData);

        // fetch unread
        const c = await fetchNotificationCount();
        setNotificationCount(c);
      } else {
        setUser(null);
      }
    };
    getUserData();
  }, []);

  useEffect(() => {
    const getUserData = async () => {
      const userData = await fetchUserData();
      if (userData) {
        setUser(userData);
        // Once we know a user is present, fetch the notification count
        const count = await fetchNotificationCount();
        setNotificationCount(count);
      } else {
        setUser(null);
      }
    };
    getUserData();
  }, []);


  const getUserRole = (): "organization_admin" | "researcher" | 'contributor' | null => {
    if (user && (user.role === "organization_admin" || 
    user.role === "researcher" || 
    user.role === "contributor")) {
      return user.role;
    }
    return null;
  };

  const userRole = getUserRole();

  useEffect(() => {
    setIsSignUpPage(pathname === "/auth/sign-up");
  }, [pathname]);


  return (
    <nav className="fixed top-0 left-0 w-full bg-white border-b border-gray-200 z-50 h-14 dark:bg-gray-900 text-gray-900 dark:text-gray-100 
    border-gray-200 dark:border-gray-700 shadow-md transition-colors">
      <div className="px-5 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button className="p-2 lg:hidden" onClick={toggleSidebar}>
            <Menu className="w-6 h-6 dark:text-gray-100" />
          </button>
          <Link href="/" className="text-lg font-bold text-black ml-2 dark:text-gray-100">
            ALACRITY
          </Link>
          <ModeToggle/>
        </div>
        <div className="flex items-center space-x-3">
        <Link 
            href={user ? "/dashboard" : "/"} 
            className={buttonVariants({ variant: "ghost" })}
          >
            {user ? "Home" : "Home"}
          </Link>
          <Link href="#" className={buttonVariants({ variant: "ghost" })}>
            About
          </Link>
        
          {userRole ? (
            <div className="flex items-center space-x-3 px-4">
{/**bell icon */}

<DropdownMenu
                onOpenChange={async (open) => {
                  if (open) {
                    // when dropdown opens, fetches notif list
                    await fetchNotificationList();
                    // also marks them all read so count is 0
                    await markAllRead();
                  }
                }}
              >
                <DropdownMenuTrigger asChild>
                  <div className="relative cursor-pointer">
                    <Bell className="w-5 h-5 text-primary hover:fill-primary dark:text-primary dark:hover:fill-primary" />
                    {/* Red badge if unread notifications exist */}
                    {notificationCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-alacrityred text-white text-xs rounded-full px-1 animate-pulse">
                        {notificationCount}
                      </span>
                    )}
                  </div>
                </DropdownMenuTrigger>

                <DropdownMenuContent className="w-64">
                  <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {notifications.length === 0 ? (
                    <DropdownMenuItem className="text-xs text-gray-500">
                      No notifications found
                    </DropdownMenuItem>
                  ) : (
                    notifications.map((notif) => (
                      <DropdownMenuItem
                      key={notif.id}
                      onClick={() => {
                        if (notif.link) {
                          window.open(notif.link, "_blank");
                        }
                      }}
                      className="relative flex items-center justify-between"
                    >
                        {/* If it was read, reduces opacity */}
                        <span className={notif.is_read ? "opacity-60" : ""}>
                          {notif.message}
                        </span>
                        {/* X button to remove notif from log */}
                        <X
                          className="w-4 h-4 text-gray-500 ml-2 cursor-pointer hover:text-red-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notif.id);
                          }}
                        />
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/*profile menu */}
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