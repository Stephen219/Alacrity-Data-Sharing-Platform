import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AllRequests from '@/components/requests/all'; // Adjust path as needed
import { useRouter } from 'next/navigation';
import * as auth from '@/libs/auth';
import '@testing-library/jest-dom';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock fetchWithAuth
jest.mock('@/libs/auth', () => ({
  fetchWithAuth: jest.fn(),
}));

describe('AllRequests Component', () => {
  const mockRouter = { push: jest.fn() };
  const mockRequests: RequestData[] = [
    {
      id: 1,
      dataset_title: 'Dataset 1',
      researcher_name: 'John Doe',
      researcher_role: 'Scientist',
      researcher_description: 'Researching climate change',
      message: 'Need this for study',
      request_status: 'pending',
      created_at: '2023-10-01T12:00:00Z',
    },
    {
      id: 2,
      dataset_title: 'Dataset 2',
      researcher_name: 'Jane Smith',
      researcher_role: 'Analyst',
      researcher_description: 'Data analysis',
      message: 'For project analysis',
      request_status: 'approved',
      created_at: '2023-10-02T14:00:00Z',
    },
  ];

  interface RequestData {
    id: number;
    dataset_title: string;
    researcher_name: string;
    researcher_role: string;
    researcher_description: string;
    message: string;
    request_status: string;
    created_at: string;
  }

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    jest.clearAllMocks();
  });

  it('displays loading state initially', () => {
    (auth.fetchWithAuth as jest.Mock).mockReturnValue(new Promise(() => {})); // Never resolves
    render(<AllRequests />);
    expect(screen.getByText('Loading requests...')).toBeInTheDocument();
  });

  it('displays error message when fetch fails', async () => {
    (auth.fetchWithAuth as jest.Mock).mockRejectedValue(new Error('Network error'));
    render(<AllRequests />);
    await waitFor(() => {
      expect(screen.getByText('Error: Network error')).toBeInTheDocument();
    });
  });

  it('filters requests by status', async () => {
    (auth.fetchWithAuth as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockRequests,
    });

    render(<AllRequests />);
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument(); // Fixed syntax here
    });

    const statusSelect = screen.getByLabelText(/sort by status/i);
    fireEvent.change(statusSelect, { target: { value: 'pending' } });

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
  });

  it('searches requests by researcher name', async () => {
    (auth.fetchWithAuth as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockRequests,
    });

    render(<AllRequests />);
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search by researcher name/i);
    fireEvent.change(searchInput, { target: { value: 'john' } });

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
  });

  it('navigates to request approval page on researcher name click', async () => {
    (auth.fetchWithAuth as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockRequests,
    });

    render(<AllRequests />);
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const researcherLink = screen.getByText('John Doe');
    fireEvent.click(researcherLink);

    expect(mockRouter.push).toHaveBeenCalledWith('/requests/approval/1');
  });

  it('displays "No requests found" when no requests match filter', async () => {
    (auth.fetchWithAuth as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockRequests,
    });

    render(<AllRequests />);
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search by researcher name/i);
    fireEvent.change(searchInput, { target: { value: 'Nonexistent' } });

    expect(screen.getByText('No requests found.')).toBeInTheDocument();
  });

  it('sorts requests by created_at in descending order', async () => {
    (auth.fetchWithAuth as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockRequests,
    });

    render(<AllRequests />);
    await waitFor(() => {
      const rows = screen.getAllByRole('row');
      // Skip header row (index 0)
      expect(rows[1]).toHaveTextContent('Jane Smith'); // Most recent first
      expect(rows[2]).toHaveTextContent('John Doe');
    });
  });
});