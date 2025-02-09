"use client"; 

import { Bell } from "lucide-react";
import MaxWidthWrapper from "./MaxWidthWrapper";
import NavItems from "./NavItems";
import Link from "next/link";
import { buttonVariants } from "./ui/button";
import { usePathname } from "next/navigation"; // Now it works because the file is a client component

// TO-DO: Replace with actual authentication logic
const getUserRole = (): "organisation" | "researcher" | null => {
<<<<<<< HEAD
  return null; // Simulating that the user is not logged in
=======
  return "organisation";
>>>>>>> development
};

const Navbar = () => {
  const userRole = getUserRole();
  const pathname = usePathname(); // Now it works for client components

  // Check if the user is on the sign-up page
  const isSignUpPage = pathname === "/sign-up";

  return (
    <div className="bg-white sticky top-0 inset-x-0 z-50 h-16">
      <header className="bg-white">
        <MaxWidthWrapper>
          <div className="border-b border-gray-200">
            <div className="flex h-16 items-center">
              
              {/* Logo */}
              <Link href="/" className="ml-4 flex items-center lg:ml-0">
                <p className="text-lg font-bold text-black">ALACRITY</p>
              </Link>

              {/* Navigation Items (Only on large screens) */}
              <div className="hidden lg:block lg:ml-12">
                {userRole && <NavItems userRole={userRole} />}
              </div>

              {/* Right-side Navigation */}
              <div className="ml-auto flex items-center space-x-4">
                {!userRole ? (
                  // Not signed in, show only Sign-In button and Sign-Up button unless on Sign-Up page
                  <>
                    <Link
                      href="/sign-in"
                      className={buttonVariants({ variant: "ghost" })}
                    >
                      Sign In
                    </Link>
                    {!isSignUpPage && (
                      <Link
                        href="/sign-up"
                        className={buttonVariants({ variant: "default" })}
                      >
                        Sign Up
                      </Link>
                    )}
                  </>
                ) : (
                  <>
                    {/* Signed-in User: Show account management and notifications */}
                    <Link
                      href="/account"
                      className={buttonVariants({ variant: "ghost" })}
                    >
                      My Account
                    </Link>
                    <Bell className="w-5 h-5 text-primary hover:fill-primary" />
                  </>
                )}
              </div>

            </div>
          </div>
        </MaxWidthWrapper>
      </header>
    </div>
  );
};

export default Navbar;
