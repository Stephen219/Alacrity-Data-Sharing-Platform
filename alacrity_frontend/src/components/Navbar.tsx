import { Bell } from "lucide-react";
import MaxWidthWrapper from "./MaxWidthWrapper";
import NavItems from "./NavItems";
import Link from "next/link";
import { buttonVariants } from "./ui/button";

// TO-DO: Replace with actual authentication logic
const getUserRole = (): "organisation" | "researcher" | null => {
  return "organisation";
};

const Navbar = () => {
  const userRole = getUserRole();

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
                <NavItems userRole={userRole} />
              </div>

              {/* Right-side Navigation */}
              <div className="ml-auto flex items-center space-x-4">
                {userRole ? (
                  <>
                    <Link
                      href="/account"
                      className={buttonVariants({ variant: "ghost" })}
                    >
                      My Account
                    </Link>
                    <Bell className="w-5 h-5 text-primary hover:fill-primary" />
                  </>
                ) : (
                  <> {/* Not signed in */}
                    <Link
                      href="/sign-in"
                      className={buttonVariants({ variant: "ghost" })}
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/sign-up"
                      className={buttonVariants({ variant: "default" })}
                    >
                      Sign Up
                    </Link>
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
