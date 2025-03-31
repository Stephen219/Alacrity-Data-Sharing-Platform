"use client";
import React, { useState, useEffect } from "react";
import { Bell, Menu, X } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "./ui/button";
import { usePathname } from "next/navigation";
import { fetchUserData, fetchWithAuth } from "@/libs/auth";
import { User } from "@/types/types";
import { BACKEND_URL } from "@/config";
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
  const [notificationCount, setNotificationCount] = useState<number>(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
 
  // Fetch user data and notification count on mount
  useEffect(() => {
    const getUserData = async () => {
      const userData = await fetchUserData();
      if (userData) {
        setUser(userData);
        const count = await fetchNotificationCount();
        setNotificationCount(count);
      } else {
        setUser(null);
      }
    };
    getUserData();
  }, []);
 
  // Update sign-up page check
  useEffect(() => {
    setIsSignUpPage(pathname === "/auth/sign-up");
  }, [pathname]);
 
  // Fetch unread notification count
  const fetchNotificationCount = async (): Promise<number> => {
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
  };
 
  // Fetch full notification list
  const fetchNotificationList = async () => {
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
  };
 
  // Mark all notifications as read
  const markAllRead = async () => {
    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/notifications/mark_all_read/`, { method: "PATCH" });
      if (!res.ok) {
        console.error("Failed to mark all read");
        return;
      }
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setNotificationCount(0);
    } catch (error) {
      console.error("Error marking all read:", error);
    }
  };
 
  // Delete a single notification
  const deleteNotification = async (notifId: string) => {
    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/notifications/${notifId}/delete/`, { method: "DELETE" });
      if (!res.ok) {
        console.error("Failed to delete notification");
        return;
      }
      setNotifications((prev) => prev.filter((n) => n.id !== notifId));
      // Optionally refresh count if backend doesn't auto-update
      const count = await fetchNotificationCount();
      setNotificationCount(count);
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };
 
  const getUserRole = (): "organization_admin" | "researcher" | "contributor" | null => {
    if (user && ["organization_admin", "researcher", "contributor"].includes(user.role)) {
      return user.role as "organization_admin" | "researcher" | "contributor";
    }
    return null;
  };
 
  const userRole = getUserRole();
 
  return (
    <nav className="fixed top-0 left-0 w-full bg-white border-b border-gray-200 z-50 h-14 dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-md transition-colors">
      <div className="px-5 py-2 flex items-center justify-between">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          <button className="p-2 lg:hidden" onClick={toggleSidebar}>
            <Menu className="w-6 h-6 dark:text-gray-100" />
          </button>
          <Link href="/" className="text-lg font-bold text-black dark:text-gray-100">
            ALACRITY
          </Link>
          <ModeToggle />
        </div>
 
        {/* Right Section */}
        <div className="flex items-center space-x-4">
          {/* Conditional Home or Organisation Sign Up */}
          {user ? (
            <Link href="/dashboard" className={buttonVariants({ variant: "ghost" })}>
              Home
            </Link>
          ) : (
            <Link href="/auth/sign-up/org-sign-up" className={buttonVariants({ variant: "ghost" })}>
              Organisation Sign Up
            </Link>
          )}
 
          <Link href="/feed" className={buttonVariants({ variant: "ghost" })}>
            Feed
          </Link>
 
          {userRole ? (
            <div className="flex items-center space-x-4">
              {/* Notification Bell */}
              <DropdownMenu
                onOpenChange={async (open) => {
                  if (open) {
                    await fetchNotificationList();
                    await markAllRead();
                  }
                }}
              >
                <DropdownMenuTrigger asChild>
                  <div className="relative cursor-pointer">
                    <Bell className="w-5 h-5 text-primary hover:fill-primary dark:text-primary dark:hover:fill-primary" />
                    {notificationCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full px-1 animate-pulse">
                        {notificationCount}
                      </span>
                    )}
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-72">
                  <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {notifications.length === 0 ? (
                    <DropdownMenuItem className="text-sm text-gray-500">
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
                        className="relative flex items-center justify-between py-2"
                      >
                        <span className={`text-sm ${notif.is_read ? "opacity-60" : ""}`}>
                          {notif.message}
                        </span>
                        <X
                          className="w-4 h-4 text-gray-500 cursor-pointer hover:text-red-600"
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
 
              {/* Profile */}
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