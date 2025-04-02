import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Contact from "@/components/Contact";

beforeEach(() => {
    global.fetch = jest.fn();
    global.alert = jest.fn(); 
});

describe("Contact Form", () => {
    test("renders contact form correctly", () => {
        render(<Contact />);
        expect(screen.getByText("Contact Us")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("name@example.com")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Briefly describe your inquiry")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Please provide more details...")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /send message/i })).toBeInTheDocument();
    });

    test("displays error message for empty subject", async () => {
        render(<Contact />);
        const subjectInput = screen.getByPlaceholderText("Briefly describe your inquiry");

        await userEvent.clear(subjectInput);
        fireEvent.submit(screen.getByTestId("contact-form"));

        await waitFor(() => {
            expect(screen.getByText("Subject must be less than 150 characters.")).toBeInTheDocument();
        });
    });

    test("displays error message for empty message", async () => {
        render(<Contact />);
        const messageInput = screen.getByPlaceholderText("Please provide more details...");

        await userEvent.clear(messageInput);
        fireEvent.submit(screen.getByTestId("contact-form"));

        await waitFor(() => {
            expect(screen.getByText("Message is too long (max 5000 characters).")).toBeInTheDocument();
        });
    });

    test("disables submit button while submitting", async () => {
        render(<Contact />);
        const emailInput = screen.getByPlaceholderText("name@example.com");
        const subjectInput = screen.getByPlaceholderText("Briefly describe your inquiry");
        const messageInput = screen.getByPlaceholderText("Please provide more details...");
        const submitButton = screen.getByRole("button", { name: /send message/i });

        await userEvent.type(emailInput, "test@example.com");
        await userEvent.type(subjectInput, "Test Subject");
        await userEvent.type(messageInput, "This is a test message.");

        (global.fetch as jest.Mock).mockResolvedValueOnce({
            json: async () => ({ success: "Email sent successfully!" }),
        });

        fireEvent.submit(screen.getByTestId("contact-form"));

        expect(submitButton).toBeDisabled();

        await waitFor(() => {
            expect(submitButton).not.toBeDisabled();
        });
    });

    test("displays success message on successful form submission", async () => {
        render(<Contact />);
        const emailInput = screen.getByPlaceholderText("name@example.com");
        const subjectInput = screen.getByPlaceholderText("Briefly describe your inquiry");
        const messageInput = screen.getByPlaceholderText("Please provide more details...");

        await userEvent.type(emailInput, "test@example.com");
        await userEvent.type(subjectInput, "Test Subject");
        await userEvent.type(messageInput, "This is a test message.");

        (global.fetch as jest.Mock).mockResolvedValueOnce({
            json: async () => ({ success: "Email sent successfully!" }),
        });

        fireEvent.submit(screen.getByTestId("contact-form"));

        await waitFor(() => {
            expect(global.alert).toHaveBeenCalledWith("Email sent successfully!");
        });
    });

    test("displays error message on failed form submission", async () => {
        render(<Contact />);
        const emailInput = screen.getByPlaceholderText("name@example.com");
        const subjectInput = screen.getByPlaceholderText("Briefly describe your inquiry");
        const messageInput = screen.getByPlaceholderText("Please provide more details...");
        const submitButton = screen.getByRole("button", { name: /send message/i });

        await userEvent.type(emailInput, "test@example.com");
        await userEvent.type(subjectInput, "Test Subject");
        await userEvent.type(messageInput, "This is a test message.");

        (global.fetch as jest.Mock).mockResolvedValueOnce({
            json: async () => ({ error: "Internal Server Error" }),
            status: 500,
        });

        fireEvent.submit(screen.getByTestId("contact-form"));

        await waitFor(() => {
            expect(screen.getByText(/internal server error/i)).toBeInTheDocument();
        });

        expect(submitButton).not.toBeDisabled();
    });
});
