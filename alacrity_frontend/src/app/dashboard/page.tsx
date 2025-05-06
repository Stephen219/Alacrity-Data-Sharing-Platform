
/**
 * Admin Component
 * 
 * This component serves as the main dashboard page for users with specific roles 
 * such as "organization_admin", "contributor", or "researcher". It dynamically 
 * renders either the `AdminDashboard` or `ResearcherDashboard` based on the 
 * authenticated user's role.
 * 
 * Features:
 * - Fetches user data asynchronously to determine the user's role.
 * - Displays a loading state while fetching user data.
 * - Implements role-based access control using the `withAccessControl` HOC.
 * 
 * Roles Supported:
 * - organization_admin
 * - contributor
 * - researcher
 * 
 * Dependencies:
 * - `fetchUserData` for retrieving user information.
 * - `withAccessControl` for enforcing access control.
 * - `AdminDashboard` and `ResearcherDashboard` for role-specific UI.
 */
/**
 * 
 */

'use client'
import AdminDashboard from "@/components/dashboards/admin";
import ResearcherDashboard from "@/components/dashboards/researcher";
import { fetchUserData } from "@/libs/auth";
import { useEffect, useState } from "react";
import type { UserRole } from "@/types/types";
import { withAccessControl } from "@/components/auth_guard/AccessControl";

function Admin() {
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRole = async () => {
      try {
        const userData = await fetchUserData();
        if (userData && (userData.role === "organization_admin" || userData.role === "contributor" ||
          userData.role === "researcher") ) {
          setUserRole(userData.role);
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRole();
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (userRole === "researcher") {
    return <ResearcherDashboard />;
  }
  return <AdminDashboard />;
}

export default withAccessControl(Admin,["organization_admin", "contributor", "researcher"]);