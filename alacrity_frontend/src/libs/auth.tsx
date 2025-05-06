"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BACKEND_URL } from "@/config";
import { User } from "@/types/types";

const API_BASE_URL = BACKEND_URL;

/**
 * * a servicce func Logs in a user with the provided email and password.
 * 
 * 
 * @param email  the email of the user
 * @param password  the password of the user
 * @param remember_me  a boolean value to remember the user or not
 * @returns 
 * - success: boolean indicating if the login was successful
 * - user: the user object if login was successful
 * - error: an error message if login failed
 */

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
    return { success: false, error: "Network error.Please try again" };
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
 
    return null;
  }

  try {
   
    const response = await fetch(`${API_BASE_URL}/users/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    const data = await response.json();

    if (response.ok) {
     
      localStorage.setItem("access_token", data.access);
      return data.access;
    } else {
     
      await logout();
      return null;
    }
  } catch (error) {
    console.error("Network error during token refresh:", error);
    await logout();
    return null;
  }
}

/**
 * THIS IS THE FUNCTIUON USED ALLTHRIOUGHOUT THE APP TO FETCH DATA IN AUTHENTICATED USERS  Kariukis
 * Fetches data from the given URL with the provided options.
 * Automatically attaches the access token to the request headers.
 * If a 401 response is received, attempts to refresh the token and retry the request.
 *
 * @param url - The URL to fetch data from.
 * @param options - Optional fetch options (method, headers, body, etc.).
 * @returns {Promise<Response>} - The response object from the fetch request.
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
    
    return;
  }

  
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
 * 
 * @returns {Promise<User | null>} - The user data or null if not authenticated.
 * Fetches user data from the API using the stored access token.
 * If the token is invalid or not present, returns null.
 * If the fetch fails, returns null.
 */

export async function fetchUserData(): Promise<User | null> {
  const token = localStorage.getItem("access_token");
  if (!token) {
   
    return null;
  }

  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/users/profile/`);
    if (response.ok) {
      const userData: User = await response.json();
     
      return userData;
    } else {
      
      return null;
    }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
   
    return null;
  }
}
