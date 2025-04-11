import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import AllMembersPage from "@/app/organisation/members/page";
import { fetchWithAuth } from "@/libs/auth";



jest.mock("next/link", () => {
  const MockLink = ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
  return MockLink;
});

// Mock fetchWithAuth
jest.mock("@/libs/auth", () => ({
  fetchWithAuth: jest.fn(),
}));


jest.mock("@/components/auth_guard/AccessControl", () => ({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  withAccessControl: (Component: unknown, _: string[]) => Component, 
}));


type User = {
  id: number;
  email: string;
  first_name: string;
  sur_name: string;
  phone_number: string;
  role: string;
  date_joined: string;
  date_of_birth: string | null;
  profile_picture: string;
};

describe("AllMembersPage", () => {
  const mockMembers: User[] = [
    {
      id: 1,
      email: "john.doe@example.com",
      first_name: "John",
      sur_name: "Doe",
      phone_number: "1234567890",
      role: "Member",
      date_joined: "2023-01-01",
      date_of_birth: null,
      profile_picture: "https://example.com/john.jpg",
    },
    {
      id: 2,
      email: "jane.smith@example.com",
      first_name: "Jane",
      sur_name: "Smith",
      phone_number: "0987654321",
      role: "Admin",
      date_joined: "2023-02-01",
      date_of_birth: "1990-05-15",
      profile_picture: "",
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("displays loading state initially", () => {
    (fetchWithAuth as jest.Mock).mockImplementation(() => new Promise(() => {})); // Never resolves
    render(<AllMembersPage />);
    expect(screen.getByText("Loading members...")).toBeInTheDocument();
  });

  it("displays error state when fetch fails", async () => {
    (fetchWithAuth as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({}),
    });
    render(<AllMembersPage />);
    await waitFor(() => {
      expect(screen.getByText("Error: Failed to load organization members")).toBeInTheDocument();
    });
  });

  
  it("renders members table successfully after fetching data", async () => {
    (fetchWithAuth as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockMembers,
    });
    render(<AllMembersPage />);

    await waitFor(() => {
      
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("john.doe@example.com")).toBeInTheDocument();
      expect(screen.getByText("1234567890")).toBeInTheDocument();
      expect(screen.getByText("Member")).toBeInTheDocument();
      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
      expect(screen.getByText("jane.smith@example.com")).toBeInTheDocument();
      expect(screen.getByText("0987654321")).toBeInTheDocument();
      expect(screen.getByText("Admin")).toBeInTheDocument();
    });

    
    expect(screen.getByAltText("John Doe")).toHaveAttribute("src", "https://example.com/john.jpg");
    expect(screen.getByText("J")).toBeInTheDocument();
  });

  it("filters members based on search query", async () => {
    (fetchWithAuth as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockMembers,
    });
    render(<AllMembersPage />);

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText("Search members...");
    fireEvent.change(searchInput, { target: { value: "john" } });

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.queryByText("Jane Smith")).not.toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: "smith" } });
    expect(screen.queryByText("John Doe")).not.toBeInTheDocument();
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: "123" } });
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.queryByText("Jane Smith")).not.toBeInTheDocument();
  });

  it("displays 'No members found' when search returns no results", async () => {
    (fetchWithAuth as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockMembers,
    });
    render(<AllMembersPage />);

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText("Search members...");
    fireEvent.change(searchInput, { target: { value: "nonexistent" } });

    expect(screen.getByText("No members found matching your search.")).toBeInTheDocument();
  });

  it("renders 'Add Members' link", async () => {
    (fetchWithAuth as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockMembers,
    });
    render(<AllMembersPage />);

    await waitFor(() => {
      const addMembersLink = screen.getByText("Add Members").closest("a");
      expect(addMembersLink).toHaveAttribute("href", "/organisation/contributors/add");
    });
  });

  it("renders 'View Profile' buttons with correct links", async () => {
    (fetchWithAuth as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockMembers,
    });
    render(<AllMembersPage />);

    await waitFor(() => {
      const viewProfileLinks = screen.getAllByText("View Profile").map((btn) => btn.closest("a"));
      expect(viewProfileLinks[0]).toHaveAttribute("href", "/organisation/members/1");
      expect(viewProfileLinks[1]).toHaveAttribute("href", "/organisation/members/2");
    });
  });
});