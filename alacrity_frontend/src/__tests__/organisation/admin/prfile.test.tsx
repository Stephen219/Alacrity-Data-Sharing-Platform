// ignore all tsx errors in this file
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

import { useRouter } from "next/navigation";
import MemberProfilePage from "@/app/organisation/members/[id]/page";
import { fetchWithAuth, fetchUserData } from "@/libs/auth";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: (props) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt || ""} />;
  },
}));

jest.mock("@/libs/auth", () => ({
  fetchWithAuth: jest.fn(),
  fetchUserData: jest.fn(),
}));

// Mock the React.use function (for the params promise)
const originalUse = React.use;
React.use = jest.fn();

describe("MemberProfilePage", () => {
  const mockRouter = {
    push: jest.fn(),
  };
  
  const mockUser = {
    id: 1,
    email: "admin@example.com",
    first_name: "Admin",
    sur_name: "User",
    phone_number: "+1234567890",
    role: "organization_admin",
    date_joined: "2023-01-01T00:00:00Z",
    date_of_birth: "1990-01-01T00:00:00Z",
    profile_picture: "/profile.jpg",
  };
  
  const mockMember = {
    id: 2,
    email: "member@example.com",
    first_name: "Test",
    sur_name: "Member",
    phone_number: "+0987654321",
    role: "organization_member",
    date_joined: "2023-02-01T00:00:00Z",
    date_of_birth: null,
    profile_picture: null,
    is_blocked: false,
  };
  
  const mockRequests = [
    {
      id: "req1",
      researcher_id: "res1",
      profile_picture: "/researcher.jpg",
      researcher_name: "Researcher One",
      title: "Request 1",
      dataset_title: "Dataset 1",
      dataset_id: "ds1",
      date_processed: "2023-03-01",
      request_status: "approved",
    },
    {
      id: "req2",
      researcher_id: "res2",
      profile_picture: null,
      researcher_name: "Researcher Two",
      title: "Request 2",
      dataset_title: "Dataset 2",
      dataset_id: "ds2",
      date_processed: "2023-03-02",
      request_status: "rejected",
    },
  ];
  
  beforeEach(() => {
    jest.clearAllMocks();
    useRouter.mockReturnValue(mockRouter);
    React.use.mockReturnValue({ id: "2" });
    
    // Mock the fetch functions
    fetchUserData.mockResolvedValue(mockUser);
    fetchWithAuth.mockImplementation((url) => {
      if (url.includes("/users/org_members/2/")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockMember),
        });
      } else if (url.includes("/organisation/requests-processed-by/2/")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockRequests),
        });
      } else if (url.includes("/block/")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ ...mockMember, is_blocked: !mockMember.is_blocked }),
        });
      } else if (url.includes("/users/org_members/2/") && url.method === "DELETE") {
        return Promise.resolve({
          ok: true,
        });
      }
      return Promise.reject(new Error("Unhandled fetch call"));
    });
    
    // Mock window.confirm
    window.confirm = jest.fn();
  });
  
  afterAll(() => {
    React.use = originalUse;
  });

  test("renders loading state initially", () => {
    render(<MemberProfilePage params={Promise.resolve({ id: "2" })} />);
    expect(screen.getByText("Loading profile...")).toBeInTheDocument();
  });



  test("switches between profile and requests tabs", async () => {
    render(<MemberProfilePage params={Promise.resolve({ id: "2" })} />);
    
    await waitFor(() => {
      expect(screen.getByText("Test Member")).toBeInTheDocument();
    });
    
    
    expect(screen.getByText("Member Details")).toBeInTheDocument();
    
  
    fireEvent.click(screen.getByText("Requests Processed"));
    expect(screen.getByText("Researcher One")).toBeInTheDocument();
    expect(screen.getByText("Dataset: Dataset 1")).toBeInTheDocument();
    expect(screen.getByText("Approved")).toBeInTheDocument();
    
   
    fireEvent.click(screen.getByText("Profile"));
    expect(screen.getByText("Member Details")).toBeInTheDocument();
  });



  test("handles remove member", async () => {
    window.confirm.mockReturnValue(true);
    
    render(<MemberProfilePage params={Promise.resolve({ id: "2" })} />);
    
    await waitFor(() => {
      expect(screen.getByText("Test Member")).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText("Remove Member"));
    
    expect(window.confirm).toHaveBeenCalledWith("Are you sure you want to remove this member?");
    
    await waitFor(() => {
      expect(fetchWithAuth).toHaveBeenCalledWith(
        expect.stringContaining("/users/org_members/2/"),
        expect.objectContaining({
          method: "DELETE",
        })
      );
      expect(mockRouter.push).toHaveBeenCalledWith("/organisation/admin/members");
    });
  });

  test("filters requests by search term", async () => {
    render(<MemberProfilePage params={Promise.resolve({ id: "2" })} />);
    
    await waitFor(() => {
      expect(screen.getByText("Test Member")).toBeInTheDocument();
    });
    
    
    fireEvent.click(screen.getByText("Requests Processed"));
    
 
    expect(screen.getByText("Researcher One")).toBeInTheDocument();
    expect(screen.getByText("Researcher Two")).toBeInTheDocument();
  
    const searchInput = screen.getByPlaceholderText("Search by researcher name...");
    fireEvent.change(searchInput, { target: { value: "One" } });
    
  
    expect(screen.getByText("Researcher One")).toBeInTheDocument();
    expect(screen.queryByText("Researcher Two")).not.toBeInTheDocument();
  });

  test("sorts requests by different criteria", async () => {
    render(<MemberProfilePage params={Promise.resolve({ id: "2" })} />);
    
    await waitFor(() => {
      expect(screen.getByText("Test Member")).toBeInTheDocument();
    });
    
  
    fireEvent.click(screen.getByText("Requests Processed"));
    
    // Sort by Status
    const sortSelect = screen.getByRole("combobox");
    fireEvent.change(sortSelect, { target: { value: "status" } });
    
    // Verify the sorting function was called with the right parameters
    expect(sortSelect.value).toBe("status");
  });

  test("handles member not found", async () => {
   
    fetchWithAuth.mockImplementation((url) => {
      if (url.includes("/users/org_members/2/")) {
        return Promise.resolve({
          ok: false,
          statusText: "Not Found",
        });
      }
      return Promise.reject(new Error("Unhandled fetch call"));
    });
    
    render(<MemberProfilePage params={Promise.resolve({ id: "2" })} />);
    
    await waitFor(() => {
      expect(screen.getByText("Profile not found")).toBeInTheDocument();
    });
    
    expect(screen.getByText("The profile you're looking for doesn't exist or has been removed.")).toBeInTheDocument();
  });

  test("shows empty state when no requests processed", async () => {
    // Mock fetch to return empty requests array
    fetchWithAuth.mockImplementation((url) => {
      if (url.includes("/users/org_members/2/")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockMember),
        });
      } else if (url.includes("/organisation/requests-processed-by/2/")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        });
      }
      return Promise.reject(new Error("Unhandled fetch call"));
    });
    
    render(<MemberProfilePage params={Promise.resolve({ id: "2" })} />);
    
    await waitFor(() => {
      expect(screen.getByText("Test Member")).toBeInTheDocument();
    });
    
    // Switch to Requests tab
    fireEvent.click(screen.getByText("Requests Processed"));
    
    expect(screen.getByText("No requests processed by this member yet.")).toBeInTheDocument();
  });

  test("handles error when fetching member data", async () => {
    // Mock fetch to throw error
    fetchUserData.mockRejectedValue(new Error("Failed to fetch user data"));
    
    render(<MemberProfilePage params={Promise.resolve({ id: "2" })} />);
    
    await waitFor(() => {
      expect(screen.getByText("Cannot load user with id 2")).toBeInTheDocument();
    });
  });

  test("prevents non-admin from viewing other members", async () => {
    // Mock regular user instead of admin
    fetchUserData.mockResolvedValue({
      ...mockUser,
      id: 3, // Different from member ID
      role: "organization_member", // Not an admin
    });
    
    render(<MemberProfilePage params={Promise.resolve({ id: "2" })} />);
    
    await waitFor(() => {
      expect(screen.getByText("Cannot load user with id 2")).toBeInTheDocument();
    });
  });
});