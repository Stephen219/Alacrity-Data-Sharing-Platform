"use client";
import { useAuth } from "@/libs/auth"; 
import { withAccessControl } from "@/components/auth_guard/AccessControl";
import { BACKEND_URL } from "@/config"
import { fetchWithAuth } from "@/libs/auth"

 function ResearcherHome() {
    const { user, loading } = useAuth();

    console.log(user);

    if (loading) {
        return <p>Loading...</p>;
    }

    const fetcdata = async () => {
        try {
            const response = await fetchWithAuth(`${BACKEND_URL}/datasets/testget/`, "GET");
            const data = await response.json();
            console.log(data);
        } catch (error) {
            console.error(error);
        }}

    return (
        <div>
            <h1>Hello {user.username}, here is your info:</h1>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Role:</strong> {user.role}</p>
            <p><strong>Phone Number:</strong> {user.phone_number}</p>
            <p><strong>Address:</strong> {user.address}</p>

            {/* 
            data */}

            <button onClick={fetcdata}>Fetch Data</button>







        </div>
    );

    
}



export default withAccessControl(ResearcherHome, ['organization_admin', 'researcher', 'contributor']);
