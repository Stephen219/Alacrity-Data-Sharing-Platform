"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BACKEND_URL } from "@/config";
import { User } from "@/types/types";

const API_BASE_URL = BACKEND_URL;

export async function login(email: string, password: string, remember_me: boolean): Promise<{ success: boolean; user?: User; error?: string }>
 {
    try {
        const response = await fetch(`${API_BASE_URL}/users/login/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password , remember_me}),
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
            window.location.href = "/auth/sign-in";
         
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
// export async function refreshToken(): Promise<string | null> {
//     const refreshToken = localStorage.getItem("refresh_token");
//     if (!refreshToken) return null;

//   if (refreshToken) {
//     try {
//       const response = await fetch(`${API_BASE_URL}/users/logout/`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           "Authorization": `Bearer ${accessToken}`,
//         },
//         body: JSON.stringify({ refresh_token: refreshToken }),
//       });

//       if (!response.ok) {
//         throw new Error("Logout failed");
//       }
//       const data = await response.json();
//       console.log(data.message);
//     } catch (error) {
//       console.error("Error during logout:", error);
//     }
//   }
//   localStorage.removeItem("access_token");
//   localStorage.removeItem("refresh_token");
//   localStorage.removeItem("user");
//   window.location.href = "/auth/sign-in";
// }

export async function refreshToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem("refresh_token");
  if (!refreshToken) {
    console.error("No refresh token available for refresh");
    return null;
  }

  try {
    console.log("Attempting token refresh with refresh_token:", refreshToken.slice(0, 10) + "...");
    const response = await fetch(`${API_BASE_URL}/users/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log("Token refresh successful, new access token:", data.access.slice(0, 10) + "...");
      localStorage.setItem("access_token", data.access);
      return data.access;
    } else {
      console.error("Token refresh failed:", data.error || "Unknown error");
      await logout();
      return null;
    }
  } catch (error) {
    console.error("Network error during token refresh:", error);
    await logout();
    return null;
  }
}


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

export function scheduleTokenRefresh() {
  const storedRefreshToken = localStorage.getItem("refresh_token");
  if (!storedRefreshToken) {
    console.error("No refresh token found for scheduling");
    return;
  }

  console.log("Scheduling token refresh every 10 minutes");
  setInterval(async () => {
    await refreshToken();
  }, 1000 * 60 * 10);
}

type AuthContextType = {
  user: User | null;
  loading: boolean;
};

export function useAuth(): AuthContextType {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      console.log("No token found, redirecting to sign-in");
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

export async function fetchUserData(): Promise<User | null> {
  const token = localStorage.getItem("access_token");
  if (!token) {
    console.error("No token for fetching user data");
    return null;
  }

  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/users/profile/`);
    if (response.ok) {
      const userData: User = await response.json();
      console.log("Fetched user data:", userData.email);
      return userData;
    } else {
      console.error("Failed to fetch user data, status:", response.status);
      return null;
    }
  } catch (error) {
    console.error("Network error fetching user data:", error);
    return null;
  }
}
