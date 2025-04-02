
import { useEffect, useState } from "react";
import { useAuth } from "@/libs/auth";
import { useRouter } from "next/navigation";
/**
 * RoleGuard Component
 * 
 * This component restricts access to its children based on the user's role.
 * If the user is not authenticated, they will be redirected to the sign-in page.
 * If the user does not have the required role, they will be redirected to an unauthorized page.
 *
 * @param {Object} props - Component props.
 * @param {string[]} props.allowedRoles - Array of roles allowed to access the children components.
 * @param {React.ReactNode} props.children - The child components to render if access is granted.
 * @returns {JSX.Element | null} - Returns children if the user has access; otherwise, handles redirection.
 **/



interface RoleGuardProps {
    allowedRoles: string[];
    children: React.ReactNode;
}

export default function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
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
    }, [user, loading, mounted, router, allowedRoles]);

    if (!mounted || loading) {
        return <div>Loading...</div>;
    }

    if (!user || !allowedRoles.includes(user.role)) {
        return null;
    }

    return <>{children}</>;
}