"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation"
import { BACKEND_URL } from "@/config";
import { User } from "@/types/types";


const API_BASE_URL = BACKEND_URL;
/**
 * Logs in the user by sending credentials to the backend.
 * Stores authentication tokens and user data in local storage.
 *
 * @param {string} email - The user's email.
 * @param {string} password - The user's password.
 * @returns {Promise<{ success: boolean; user?: any; error?: string }>} - Login result.
 */

export async function login(email: string, password: string) {
    try {
        const response = await fetch(`${API_BASE_URL}/users/login/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem("access_token", data.access_token);
            localStorage.setItem("refresh_token", data.refresh_token);
            localStorage.setItem("user", JSON.stringify(data.user));

            
            scheduleTokenRefresh(); 

            return { success: true, user: data.user };
        } else {
            return { success: false, error: data.error || "Login failed" };
        }
    } catch (error) {
        console.error("Login failed", error);
        return { success: false, error: "Network error" };
    }
}

/**
 * Logs out the user by removing authentication tokens from local storage
 * and redirecting to the sign-in page.
 */
export async function logout() {
    const refreshToken = localStorage.getItem("refresh_token");
    const accessToken = localStorage.getItem("access_token");


    if (refreshToken) {
        try {
            const response = await fetch(`${API_BASE_URL}/users/logout/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${accessToken}`,
                },

                body: JSON.stringify({
                    refresh_token: refreshToken,
                }),
            });

            if (!response.ok) {
                throw new Error("Logout failed");
            }

            const data = await response.json();
            console.log(data.message);
        } catch (error) {
            console.error("Error during logout:", error);
         
        }
    }
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    window.location.href = "/auth/sign-in";
}
/**
 * Attempts to refresh the access token using the stored refresh token.
 * If successful, updates the stored access token.
 * If the refresh token is invalid, logs the user out.
 *
 * @returns {Promise<string | null>} - The new access token or null if refresh fails.
 */
export async function refreshToken(): Promise<string | null> {
    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) return null;

    try {
        const response = await fetch(`${API_BASE_URL}/users/token/refresh/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refresh: refreshToken }),
        });

        const data = await response.json();

        if (response.ok) {
            // Update access token and return it
            localStorage.setItem("access_token", data.access);
            return data.access;
        } else {
            logout(); // If refresh fails, log the user out
            return null;
        }
    } catch (error) {
        console.error("Token refresh failed", error);
        logout(); // In case of error, log the user out
        return null;
    }
}

/**
 * Makes an authenticated API request with automatic token refresh if needed.
 *
 * @param {string} url - The API endpoint to fetch.
 * @param {RequestInit} [options={}] - Additional fetch options.
 * @returns {Promise<Response>} - The API response.
 */


export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
    const executeRequest = async (token: string): Promise<Response> => {
        return fetch(url, {
            ...options,
            headers: {
                ...options.headers,
                'Authorization': `Bearer ${token}`,
            },
        });
    };

    const accessToken = localStorage.getItem("access_token");
    
    if (!accessToken) {
        console.error("No access token found");
         await logout();
         return new (class MockResponse {
            ok = false;
            status = 401;
            json = async () => ({});
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        })() as any; 
    
    }

    
    let response = await executeRequest(accessToken);

   
    if (response.status === 401) {
        try {
            const newToken = await refreshToken();
            if (!newToken) {
                logout();
                return new Response(null, { status: 401 });
            }
            
           
            response = await executeRequest(newToken);
        } catch (error) {
            console.error("Token refresh failed:", error);
            await logout();
            return new Response(null, { status: 401 });
        }
    }

    return response;
}

/**
 *  Ensures that users remain authenticated without manual intervention.
 * @returns {void} - Schedules a token refresh every 10 minutes.
 */


export function scheduleTokenRefresh() {
    const storedRefreshToken = localStorage.getItem("refresh_token");
    if (!storedRefreshToken) return;

   
    setInterval(async () => {
        await refreshToken(); }, 1000 * 60 * 10);  
}








  





  type AuthContextType = {
    user: User | null;
    loading: boolean;
  };
  


/**
 * React hook that provides authentication state (user info and loading status).
 * Redirects to login if no valid session is found.
 *
 * @returns {{ user: any | null; loading: boolean }} - The current user and loading state.
 */

// FIXME   THIS FUNCTION IS WOIRKING BUT TYPESCRIPT IS COMPLAINING ABOUT THE RETURN TYPE




export function useAuth(): AuthContextType {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem("access_token");
        if (!token) {
            router.push("/auth/sign-in");
        } else {
            scheduleTokenRefresh();

            const storedUser = localStorage.getItem("user");
            if (storedUser) {
                setUser(JSON.parse(storedUser));
                setLoading(false);
            } else {
                fetchUserData().then((data) => {
                    if (data) {
                        setUser(data);
                        localStorage.setItem("user", JSON.stringify(data));
                    }
                    setLoading(false);
                });
            }
        }
    }, [router]);

    return { user, loading };
}


/**
 * Fetches the current authenticated user's data from the backend.
 * 
 * @returns {Promise<any | null>} - The user data or null if fetching fails.
 */




export async function fetchUserData(): Promise<User | null> {
    const token = localStorage.getItem("access_token");
    if (!token) return null;

    try {
        const response = await fetchWithAuth(`${API_BASE_URL}/users/profile/`);  // TODO :  IMPLEMEENT THE /USERS/ME/ ENDPOINT
        if (response.ok) {
            const userData: User = await response.json();
            return userData;
        } else {
            console.error("Failed to fetch user data");
            return null;
        }
    } catch (error) {
        console.error("Network error", error);
        return null;
    }
}

