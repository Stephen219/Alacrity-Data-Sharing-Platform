
// "use client";

// import { useAuth } from "@/libs/auth";
// import { withAccessControl } from "@/components/auth_guard/AccessControl";

// function OrganizationPage() {
//     const { user, loading } = useAuth();

//     if (loading) {
//         return <p>Loading...</p>;
//     }

//     return (
//         <div>
//             <h1>Hello {user.username}, here is your info:</h1>
//             <p><strong>Email:</strong> {user.email}</p>
//             <p><strong>Role:</strong> {user.role}</p>
//             <p><strong>Phone Number:</strong> {user.phone_number}</p>
//             <p><strong>Address:</strong> {user.address}</p>
//         </div>
//     );
// }

// export default withAccessControl(OrganizationPage, ['organization_admin']);


"use client";

import { useAuth } from "@/libs/auth";
import { withAccessControl } from "@/components/auth_guard/AccessControl";

function OrganizationPage() {
  const { user, loading } = useAuth(); // FIXME: THERE IS A FETCH USER DATA FUNCTION THAT IS IN THE AUTH FILE THAT IS NOT BEING USED HERE

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!user) {
    return <p>No user data available.</p>;
  }

  return (
    <div>
      <h1>Hello {user.email}, here is your info:</h1>
      <p><strong>Email:</strong> {user.email}</p>
      <p><strong>Role:</strong> {user.role}</p>
      <p><strong>Phone Number:</strong> {user.phone_number}</p>
      <p><strong>Address:</strong> {user.address}</p>
    </div>
  );
}

export default withAccessControl(OrganizationPage, ['organization_admin']);
