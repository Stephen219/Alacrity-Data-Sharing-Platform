"use client"
import { useEffect, useState } from "react";
import { useAuth } from "@/libs/auth";
import { useRouter } from "next/navigation";


/**
 * Higher-Order Component (HOC) for Access Control
 * 
 * This HOC wraps a given component and restricts access based on the user's role.
 * If the user is not authenticated, they will be redirected to the sign-in page.
 * If the user does not have the required role, they will be redirected to a 403 error page.
 *
 * @param {React.ComponentType} Component - The component to be protected.
 * @param {string[]} allowedRoles - Array of roles permitted to access the component.
 * @returns {React.FC} - A protected component with role-based access control.
 */


 // NOTE: 12/02/2025   IF THIS COMPONENT IS NOT WORKING REVERT TO THE CHANGES IN THE COMMIT   I CHANGED TO FIX THE TYPE ERROR IN THE  TYPE SCRIPT FILE
 // https://git.cardiff.ac.uk/c2051028/alacrity/-/commit/832b405089ebd4d6bf9d4aa4c09db2729a702d50?page=2#4f8cef0316e03de62b2fe26fb3e18d5ce8265499  


export function withAccessControl<T extends object>(
    Component: React.ComponentType<T>,
    allowedRoles: string[]
) {
    return function ProtectedRoute(props: T) { 
        const { user, loading } = useAuth();
        const router = useRouter();
        const [mounted, setMounted] = useState(false);

        useEffect(() => {
            setMounted(true);
        }, []);

        useEffect(() => {
            if (mounted && !loading) {
                if (!user) {
                    router.push("/auth/sign-in");
                } else if (!allowedRoles.includes(user.role)) {
                    router.push("/errors/403");
                }
            }
        }, [user, loading, mounted, router]);

        if (!mounted || loading) {
            return <div>Loading...</div>;
        }

        if (!user || !allowedRoles.includes(user.role)) {
            return null;
        }

        return <Component {...props} />;
    };
}
