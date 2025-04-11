import { renderHook } from "@testing-library/react";
import { waitFor } from "@testing-library/react";
import {
  login,
  logout,
  refreshToken,
  fetchWithAuth,
  scheduleTokenRefresh,
  useAuth,
  fetchUserData,
} from "../../libs/auth";
import { useRouter } from "next/navigation";
import { User } from "@/types/types";
import { BACKEND_URL } from "@/config";

// Polyfill Response for Node environment
global.Response = class Response {
  constructor(body: BodyInit | null, init: ResponseInit = {}) {
    this.body = JSON.stringify(body);
    this.status = init.status || 200;
    this.ok = this.status >= 200 && this.status < 300;
    this.headers = new Map(Object.entries(init.headers || {}));
  }
  body: string;
  status: number;
  ok: boolean;
  headers: Map<string, string>;
  json() {
    return Promise.resolve(JSON.parse(this.body));
  }
  text() {
    return Promise.resolve(this.body);
  }
} as unknown as typeof globalThis.Response; // Cast to the global Response type

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
    jest.useFakeTimers();

    // Reset window.location for redirect checks
    // @ts-expect-error Allow deleting window.location for test setup
    delete window.location;
    // @ts-expect-error Allow assigning to window.location for mocking
    window.location = { href: "" };
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("login", () => {
    it("logs in successfully", async () => {
      const mockUser: User = { id: 1, email: "test@example.com" };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          access_token: "access123",
          refresh_token: "refresh123",
          user: mockUser,
        }),
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
      (global.fetch as jest.Mock).mockRejectedValue(new Error("Network error.Please try again "));

      const result = await login("test@example.com", "password123");

      expect(result).toEqual({ success: false, error: "Network error.Please try again" });
    });
  });

  describe("logout", () => {
    it("logs out with tokens successfully", async () => {
      (window.localStorage.getItem as jest.Mock).mockImplementation((key) =>
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
            Authorization: "Bearer access123",
            "Content-Type": "application/json",
          }),
          body: JSON.stringify({ refresh_token: "refresh123" }),
        })
      );
      ["access_token", "refresh_token", "user"].forEach((token) =>
        expect(window.localStorage.removeItem).toHaveBeenCalledWith(token)
      );
      expect(window.location.href).toBe("/auth/sign-in");
    });

    it("logs out gracefully without tokens", async () => {
      (window.localStorage.getItem as jest.Mock).mockReturnValue(null);

      await logout();

      expect(global.fetch).not.toHaveBeenCalled();
      ["access_token", "refresh_token", "user"].forEach((token) =>
        expect(window.localStorage.removeItem).toHaveBeenCalledWith(token)
      );
      expect(window.location.href).toBe("/auth/sign-in");
    });

    it("handles server failure during logout", async () => {
      (window.localStorage.getItem as jest.Mock).mockImplementation((key) =>
        key === "refresh_token" ? "refresh123" : key === "access_token" ? "access123" : null
      );
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => "Server error",
      });

      await logout();

      expect(global.fetch).toHaveBeenCalled();
      ["access_token", "refresh_token"].forEach((token) =>
        expect(window.localStorage.removeItem).toHaveBeenCalledWith(token)
      );
      expect(window.location.href).toBe("/auth/sign-in");
    });
  });

  describe("refreshToken", () => {
    it("refreshes token successfully", async () => {
      (window.localStorage.getItem as jest.Mock).mockImplementation((key) =>
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
      (window.localStorage.getItem as jest.Mock).mockImplementation((key) =>
        key === "refresh_token" ? "refresh123" : key === "access_token" ? "access123" : null
      );
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => "Unauthorized",
      });

      const newToken = await refreshToken();

      expect(newToken).toBeNull();
      expect(window.location.href).toBe("/auth/sign-in");
    });
  });

  describe("fetchWithAuth", () => {
    it("fetches successfully with valid token", async () => {
      (window.localStorage.getItem as jest.Mock).mockImplementation((key) =>
        key === "access_token" ? "access123" : null
      );
      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => ({}),
        text: async () => "{}",
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const response = await fetchWithAuth("http://example.com");

      expect(response).toBe(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        "http://example.com",
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: "Bearer access123" }),
        })
      );
    });

    it("refreshes token and retries on 401", async () => {
      (window.localStorage.getItem as jest.Mock).mockImplementation((key) =>
        key === "access_token" ? "oldAccess123" : key === "refresh_token" ? "refresh123" : null
      );
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          text: async () => "Unauthorized",
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access: "newAccess123" }),
          text: async () => JSON.stringify({ access: "newAccess123" }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({}),
          text: async () => "{}",
        });

      const response = await fetchWithAuth("http://example.com");

      expect(response.status).toBe(200);
      expect(window.localStorage.setItem).toHaveBeenCalledWith("access_token", "newAccess123");
    });

    it("logs out if no access token", async () => {
      (window.localStorage.getItem as jest.Mock).mockReturnValue(null);

      const response = await fetchWithAuth("http://example.com");

      expect(response.status).toBe(401);
      expect(window.location.href).toBe("/auth/sign-in");
    });
  });

  describe("scheduleTokenRefresh", () => {
    it("schedules refresh if token exists", () => {
      (window.localStorage.getItem as jest.Mock).mockImplementation((key) =>
        key === "refresh_token" ? "refresh123" : null
      );
      const intervalSpy = jest.spyOn(global, "setInterval");

      scheduleTokenRefresh();

      expect(intervalSpy).toHaveBeenCalledWith(expect.any(Function), 1000 * 60 * 10);
    });

    it("does not schedule refresh without token", () => {
      (window.localStorage.getItem as jest.Mock).mockReturnValue(null);
      const intervalSpy = jest.spyOn(global, "setInterval");

      scheduleTokenRefresh();

      expect(intervalSpy).not.toHaveBeenCalled();
    });
  });

  describe("useAuth", () => {
    it("returns user when data exists in storage", async () => {
      const mockUser: User = { id: 1, email: "test@example.com" };
      (window.localStorage.getItem as jest.Mock).mockImplementation((key) =>
        key === "access_token"
          ? "access123"
          : key === "user"
          ? JSON.stringify(mockUser)
          : null
      );

      const { result } = renderHook(() => useAuth());

      await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 2000 });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.loading).toBe(false);
    });

    it("redirects to sign-in if no token", async () => {
      (window.localStorage.getItem as jest.Mock).mockReturnValue(null);

      renderHook(() => useAuth());

      expect(mockRouter.push).toHaveBeenCalledWith("/auth/sign-in");
    });

    it("fetches user data if missing", async () => {
      const mockUser: User = { id: 1, email: "test@example.com" };
      (window.localStorage.getItem as jest.Mock).mockImplementation((key) =>
        key === "access_token" ? "access123" : null
      );
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockUser,
        text: async () => JSON.stringify(mockUser),
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
      (window.localStorage.getItem as jest.Mock).mockImplementation((key) =>
        key === "access_token" ? "access123" : null
      );
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockUser,
        text: async () => JSON.stringify(mockUser),
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
      (window.localStorage.getItem as jest.Mock).mockImplementation((key) =>
        key === "access_token" ? "access123" : null
      );
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => "Server error",
      });

      const userData = await fetchUserData();

      expect(userData).toBeNull();
    });
  });
});