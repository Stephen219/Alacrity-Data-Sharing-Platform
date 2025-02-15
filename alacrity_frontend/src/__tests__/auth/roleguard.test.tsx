import { render, screen, waitFor } from "@testing-library/react";
import RoleGuard from "@/components/auth_guard/roleGuard";
import { useAuth } from "@/libs/auth";
import { useRouter } from "next/navigation";

// Mock the custom hook `useAuth` and `useRouter` used in the component
jest.mock("@/libs/auth", () => ({
    useAuth: jest.fn(),
}));

jest.mock("next/navigation", () => ({
    useRouter: jest.fn(),
}));

describe("RoleGuard", () => {
    const pushMock = jest.fn();
    const allowedRoles = ["admin", "user"];

    beforeEach(() => {
        pushMock.mockClear();
        useRouter.mockReturnValue({ push: pushMock });
    });

    it("should render loading state while checking auth", () => {
        (useAuth as jest.Mock).mockReturnValue({
            user: null,
            loading: true,
        });

        render(<RoleGuard allowedRoles={allowedRoles}>Protected Content</RoleGuard>);

        expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("should redirect to sign-in if user is not authenticated", async () => {
        (useAuth as jest.Mock).mockReturnValue({
            user: null,
            loading: false,
        });

        render(<RoleGuard allowedRoles={allowedRoles}>Protected Content</RoleGuard>);

        await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/auth/sign-in"));
    });

    it("should redirect to unauthorized if user does not have the required role", async () => {
        (useAuth as jest.Mock).mockReturnValue({
            user: { role: "guest" },
            loading: false,
        });

        render(<RoleGuard allowedRoles={allowedRoles}>Protected Content</RoleGuard>);

        await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/unauthorized"));
    });

    it("should render children if user has the required role", () => {
        (useAuth as jest.Mock).mockReturnValue({
            user: { role: "admin" },
            loading: false,
        });

        render(<RoleGuard allowedRoles={allowedRoles}>Protected Content</RoleGuard>);

        expect(screen.getByText("Protected Content")).toBeInTheDocument();
    });
});
