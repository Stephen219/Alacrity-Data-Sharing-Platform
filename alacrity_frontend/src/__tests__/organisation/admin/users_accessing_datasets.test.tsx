import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";


import DatasetUsersPage from "@/app/organisation/admin/datasets/[id]/users_accessing/page";
import { fetchWithAuth } from "@/libs/auth";
import { useRouter } from "next/navigation";


jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("react", () => {
  const originalReact = jest.requireActual("react");
  return {
    ...originalReact,
    use: jest.fn(),
  };
});

jest.mock("@/libs/auth", () => ({
  fetchWithAuth: jest.fn(),
}));

jest.mock("@/components/auth_guard/AccessControl", () => ({
  withAccessControl: (component: unknown) => component,
}));

const mockUsers = [
  {
    user: {
      id: 1,
      username: "user1",
      first_name: "John",
      sur_name: "Doe",
      profile_picture: "/profile1.jpg",
      date_joined: "2023-01-01T00:00:00.000Z",
    },
    updated_by: {
      id: 3,
      first_name: "Admin",
      sur_name: "User",
    },
    request_id: "req123",
    created_at: "2023-02-01T00:00:00.000Z",
    updated_at: "2023-02-10T00:00:00.000Z",
  },
  {
    user: {
      id: 2,
      username: "user2",
      first_name: "Jane",
      sur_name: "Smith",
      profile_picture: null,
      date_joined: "2023-01-15T00:00:00.000Z",
    },
    updated_by: null,
    request_id: "req456",
    created_at: "2023-02-05T00:00:00.000Z",
    updated_at: "2023-02-05T00:00:00.000Z",
  },
];

describe("DatasetUsersPage", () => {
  const mockPush = jest.fn();
  const mockParams = { id: "123" };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up the default mocks
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    
    (React.use as jest.Mock).mockReturnValue(mockParams);
    
    // Default successful API response
    (fetchWithAuth as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockUsers),
    });

    // Mock window.matchMedia
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: jest.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  });

  test("renders loading state initially", async () => {
    render(<DatasetUsersPage params={Promise.resolve(mockParams)} />);
    expect(screen.getByText("Loading users...")).toBeInTheDocument();
  });

  test("fetches and displays users with access", async () => {
    render(<DatasetUsersPage params={Promise.resolve(mockParams)} />);
    
    await waitFor(() => {
      expect(fetchWithAuth).toHaveBeenCalled();
    });
    
    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    });
  });

  test("filters users by search query", async () => {
    render(<DatasetUsersPage params={Promise.resolve(mockParams)} />);
    
    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });
    
    const searchInput = screen.getByPlaceholderText("Search by name...");
    fireEvent.change(searchInput, { target: { value: "Jane" } });
    
    await waitFor(() => {
      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
      expect(screen.queryByText("John Doe")).not.toBeInTheDocument();
    });
  });

  test("sorts users by different criteria", async () => {
    render(<DatasetUsersPage params={Promise.resolve(mockParams)} />);
    
    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });
    
    // Open sort options
    fireEvent.click(screen.getByText(/Sort by:/));
    
    // Select A-Z sorting
    fireEvent.click(screen.getByText("A-Z"));
    
    // Verify sorting (Jane comes before John alphabetically)
    const userItems = screen.getAllByText(/Jane|John/);
    expect(userItems[0].textContent).toBe("Jane Smith");
    expect(userItems[1].textContent).toBe("John Doe");
  });

  test("shows error message when API fetch fails", async () => {
    (fetchWithAuth as jest.Mock).mockResolvedValue({
      ok: false,
      statusText: "Server Error",
    });
    
    render(<DatasetUsersPage params={Promise.resolve(mockParams)} />);
    
    await waitFor(() => {
      expect(screen.getByText(/Error: Failed to fetch data: Server Error/)).toBeInTheDocument();
    });
  });

  test("clears filters when button is clicked", async () => {
    render(<DatasetUsersPage params={Promise.resolve(mockParams)} />);
    
    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });
    
    // Apply search filter
    const searchInput = screen.getByPlaceholderText("Search by name...");
    fireEvent.change(searchInput, { target: { value: "Jane" } });
    
    // Only Jane should be visible
    await waitFor(() => {
      expect(screen.queryByText("John Doe")).not.toBeInTheDocument();
      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    });
    
    // Clear filters
    fireEvent.click(screen.getByText("Clear filters"));
    
    // Both users should be visible again
    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    });
  });

 



  test("handles failed revocation attempt", async () => {
    // Setup initial users fetch
    (fetchWithAuth as jest.Mock).mockImplementation((url) => {
      if (url.includes("users-with-access")) {
        return {
          ok: true,
          json: jest.fn().mockResolvedValue(mockUsers),
        };
      } else if (url.includes("requestaction")) {
        return {
          ok: false,
          statusText: "Forbidden",
        };
      }
    });
    
    render(<DatasetUsersPage params={Promise.resolve(mockParams)} />);
    
    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });
    
    // Click revoke access button for John Doe
    const revokeButtons = screen.getAllByText("Revoke Access");
    fireEvent.click(revokeButtons[0]);
    
    // Confirm revocation
    fireEvent.click(screen.getByText("Yes, Revoke Access"));
    
    // Error message should appear
    await waitFor(() => {
      expect(screen.getByText(/Error: Failed to revoke access: Forbidden/)).toBeInTheDocument();
    });
  });

  test("navigates back to dataset page when back button is clicked", async () => {
    render(<DatasetUsersPage params={Promise.resolve(mockParams)} />);
    
    // Click back button
    fireEvent.click(screen.getByText("Back to Dataset"));
    
    expect(mockPush).toHaveBeenCalledWith("/organisation/admin/datasets/123");
  });

  test("handles empty user list correctly", async () => {
    (fetchWithAuth as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue([]),
    });
    
    render(<DatasetUsersPage params={Promise.resolve(mockParams)} />);
    
    await waitFor(() => {
      expect(screen.getByText("No users found matching your filters")).toBeInTheDocument();
    });
  });
});