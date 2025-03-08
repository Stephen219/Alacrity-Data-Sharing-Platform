
import { renderHook } from "@testing-library/react";
import { waitFor } from "@testing-library/react"; // Added import
import {
  login,
  logout,
  refreshToken,
  fetchWithAuth,
  scheduleTokenRefresh,
  useAuth,
  fetchUserData,
} from "../../libs/auth"; // Adjusted path
import { useRouter } from "next/navigation";
import { User } from "@/types/types";
import { BACKEND_URL } from "@/config";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

global.fetch = jest.fn() as jest.Mock;

beforeAll(() => {
  Object.defineProperty(window, "localStorage", {
    value: {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    },
    writable: true,
  });
});

describe("Authentication Functions", () => {
  let mockRouter: ReturnType<typeof useRouter>;
  const API_BASE_URL = BACKEND_URL;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRouter = { push: jest.fn() } as ReturnType<typeof useRouter>;
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (window.localStorage.getItem as jest.Mock).mockReset();
    (window.localStorage.setItem as jest.Mock).mockReset();
    (window.localStorage.removeItem as jest.Mock).mockReset();
    jest.useFakeTimers();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).location;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).location = { href: "" };
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("login", () => {
    it("logs in successfully", async () => {
      const mockUser: User = { id: 1, email: "test@example.com" };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ access_token: "access123", refresh_token: "refresh123", user: mockUser }),
      });

      const result = await login("test@example.com", "password123");

      expect(result).toEqual({ success: true, user: mockUser });
      expect(window.localStorage.setItem).toHaveBeenCalledWith("access_token", "access123");
      expect(window.localStorage.setItem).toHaveBeenCalledWith("refresh_token", "refresh123");
      expect(window.localStorage.setItem).toHaveBeenCalledWith("user", JSON.stringify(mockUser));
    });

    it("handles login failure", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({ error: "Invalid credentials" }),
      });

      const result = await login("test@example.com", "wrongpassword");

      expect(result).toEqual({ success: false, error: "Invalid credentials" });
    });

    it("handles network error", async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"));

      const result = await login("test@example.com", "password123");

      expect(result).toEqual({ success: false, error: "Network error" });
    });
  });

  describe("logout", () => {
    it("logs out with tokens successfully", async () => {
      (window.localStorage.getItem as jest.Mock).mockImplementation((key: string) =>
        key === "refresh_token" ? "refresh123" : key === "access_token" ? "access123" : null
      );
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ message: "Logged out" }),
      });

      await logout();

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/users/logout/`,
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Authorization": "Bearer access123", // Corrected expectation
            "Content-Type": "application/json",
          }),
          body: JSON.stringify({ refresh_token: "refresh123" }),
        })
      );
      expect(window.localStorage.removeItem).toHaveBeenCalledWith("access_token");
      expect(window.localStorage.removeItem).toHaveBeenCalledWith("refresh_token");
      expect(window.localStorage.removeItem).toHaveBeenCalledWith("user");
      expect(window.location.href).toBe("/auth/sign-in");
    });



    it("logs out without tokens", async () => {
      (window.localStorage.getItem as jest.Mock).mockReturnValue(null);

      await logout();

      expect(global.fetch).not.toHaveBeenCalled();
      expect(window.localStorage.removeItem).toHaveBeenCalledWith("access_token");
      expect(window.localStorage.removeItem).toHaveBeenCalledWith("refresh_token");
      expect(window.localStorage.removeItem).toHaveBeenCalledWith("user");
      expect(window.location.href).toBe("/auth/sign-in");
    });

    it("handles server failure", async () => {
      (window.localStorage.getItem as jest.Mock).mockImplementation((key: string) =>
        key === "refresh_token" ? "refresh123" : key === "access_token" ? "access123" : null
      );
      (global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 500 });

      await logout();

      expect(global.fetch).toHaveBeenCalled();
      expect(window.localStorage.removeItem).toHaveBeenCalledWith("access_token");
      expect(window.localStorage.removeItem).toHaveBeenCalledWith("refresh_token");
      expect(window.location.href).toBe("/auth/sign-in");
    });
  });

  describe("refreshToken", () => {
    it("refreshes token successfully", async () => {
      (window.localStorage.getItem as jest.Mock).mockImplementation((key: string) =>
        key === "refresh_token" ? "refresh123" : null
      );
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ access: "newAccess123" }),
      });

      const newToken = await refreshToken();

      expect(newToken).toBe("newAccess123");
      expect(window.localStorage.setItem).toHaveBeenCalledWith("access_token", "newAccess123");
    });

    it("returns null without refresh token", async () => {
      (window.localStorage.getItem as jest.Mock).mockReturnValue(null);

      const newToken = await refreshToken();

      expect(newToken).toBeNull();
    });

    it("logs out on refresh failure", async () => {
      (window.localStorage.getItem as jest.Mock).mockImplementation((key: string) =>
        key === "refresh_token" ? "refresh123" : key === "access_token" ? "access123" : null
      );
      (global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 401 });

      const newToken = await refreshToken();

      expect(newToken).toBeNull();
      expect(window.location.href).toBe("/auth/sign-in");
    });
  });

  describe("fetchWithAuth", () => {
    it("fetches with valid token", async () => {
      (window.localStorage.getItem as jest.Mock).mockImplementation((key: string) =>
        key === "access_token" ? "access123" : null
      );
      const mockResponse = { ok: true, status: 200, json: async () => ({}) };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const response = await fetchWithAuth("http://example.com");

      expect(response).toBe(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        "http://example.com",
        expect.objectContaining({
          headers: expect.objectContaining({ "Authorization": "Bearer access123" }),
        })
      );
    });

    it("refreshes token on 401", async () => {
      (window.localStorage.getItem as jest.Mock).mockImplementation((key: string) =>
        key === "access_token" ? "oldAccess123" : key === "refresh_token" ? "refresh123" : null
      );
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({}) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ access: "newAccess123" }) })
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({}) });

      const response = await fetchWithAuth("http://example.com");

      expect(response.status).toBe(200);
      expect(window.localStorage.setItem).toHaveBeenCalledWith("access_token", "newAccess123");
    });

    it("logs out without access token", async () => {
      (window.localStorage.getItem as jest.Mock).mockReturnValue(null);

      const response = await fetchWithAuth("http://example.com");

      expect(response.status).toBe(401);
      expect(window.location.href).toBe("/auth/sign-in");
    });
  });

  describe("scheduleTokenRefresh", () => {
    it("schedules refresh with token", () => {
      (window.localStorage.getItem as jest.Mock).mockImplementation((key: string) =>
        key === "refresh_token" ? "refresh123" : null
      );
      const setIntervalSpy = jest.spyOn(global, "setInterval");

      scheduleTokenRefresh();

      expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 1000 * 60 * 10);
    });

    it("does not schedule without token", () => {
      (window.localStorage.getItem as jest.Mock).mockReturnValue(null);
      const setIntervalSpy = jest.spyOn(global, "setInterval");

      scheduleTokenRefresh();

      expect(setIntervalSpy).not.toHaveBeenCalled();
    });
  });

  describe("useAuth", () => {
    it("returns user with existing data", async () => {
      const mockUser: User = { id: 1, email: "test@example.com" };
      (window.localStorage.getItem as jest.Mock).mockImplementation((key: string) =>
        key === "access_token" ? "access123" : key === "user" ? JSON.stringify(mockUser) : null
      );

      const { result } = renderHook(() => useAuth());

      await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 2000 });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.loading).toBe(false);
    });

    it("redirects without token", async () => {
      (window.localStorage.getItem as jest.Mock).mockReturnValue(null);

      renderHook(() => useAuth());

      expect(mockRouter.push).toHaveBeenCalledWith("/auth/sign-in");
    });

    it("fetches user data if missing", async () => {
      const mockUser: User = { id: 1, email: "test@example.com" };
      (window.localStorage.getItem as jest.Mock).mockImplementation((key: string) =>
        key === "access_token" ? "access123" : null
      );
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockUser,
      });

      const { result } = renderHook(() => useAuth());

      await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 2000 });

      expect(result.current.user).toEqual(mockUser);
      expect(window.localStorage.setItem).toHaveBeenCalledWith("user", JSON.stringify(mockUser));
    });
  });

  describe("fetchUserData", () => {
    it("fetches user data successfully", async () => {
      const mockUser: User = { id: 1, email: "test@example.com" };
      (window.localStorage.getItem as jest.Mock).mockImplementation((key: string) =>
        key === "access_token" ? "access123" : null
      );
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockUser,
      });

      const userData = await fetchUserData();

      expect(userData).toEqual(mockUser);
    });

    it("returns null without token", async () => {
      (window.localStorage.getItem as jest.Mock).mockReturnValue(null);

      const userData = await fetchUserData();

      expect(userData).toBeNull();
    });

    it("returns null on failure", async () => {
      (window.localStorage.getItem as jest.Mock).mockImplementation((key: string) =>
        key === "access_token" ? "access123" : null
      );
      (global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 500 });

      const userData = await fetchUserData();

      expect(userData).toBeNull();
    });
  });
});