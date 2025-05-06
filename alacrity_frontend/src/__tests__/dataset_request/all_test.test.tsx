// AllRequests.test.tsx
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AllRequests from '@/components/requests/all'; 
import { fetchWithAuth } from '@/libs/auth';
import { useRouter } from 'next/navigation';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock fetchWithAuth function
jest.mock('@/libs/auth', () => ({
  fetchWithAuth: jest.fn(),
}));

// Mock config
jest.mock('../../config', () => ({
  BACKEND_URL: 'http://test-api.example.com',
}));

describe('AllRequests Component', () => {
  const mockRouter = {
    push: jest.fn(),
  };

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    jest.clearAllMocks();
  });

  const mockRequests = [
    {
      id: 1,
      dataset_title: 'Climate Change Dataset',
      researcher_name: 'Jane Smith',
      researcher_role: 'Professor',
      researcher_description: 'Environmental scientist',
      message: 'Need access for research',
      request_status: 'pending',
      created_at: '2025-04-01T12:00:00Z',
      profile_picture: null
    },
    {
      id: 2,
      dataset_title: 'Healthcare Analytics',
      researcher_name: 'John Doe',
      researcher_role: 'Analyst',
      researcher_description: 'Healthcare researcher',
      message: 'Analysis project',
      request_status: 'approved',
      created_at: '2025-04-05T10:00:00Z',
      profile_picture: null
    },
    {
      id: 3,
      dataset_title: 'Financial Metrics',
      researcher_name: 'Alice Johnson',
      researcher_role: 'Data Scientist',
      researcher_description: 'Finance expert',
      message: 'Financial analysis',
      request_status: 'rejected',
      created_at: '2025-04-02T15:30:00Z',
      profile_picture: null
    }
  ];

  test('renders loading state initially', () => {
    // Mock fetch to delay response
    (fetchWithAuth as jest.Mock).mockImplementation(() => new Promise(() => {}));
    
    render(<AllRequests />);
    
    expect(screen.getByText('All Requests')).toBeInTheDocument();
    // Check for loading skeletons
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  test('renders error state when fetch fails', async () => {
    const errorMessage = 'Failed to fetch: Network Error';
    (fetchWithAuth as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));
    
    render(<AllRequests />);
    
    await waitFor(() => {
      expect(screen.getByText('Error Loading Requests')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  test('renders requests correctly', async () => {
    (fetchWithAuth as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockRequests)
    });
    
    render(<AllRequests />);
    
    await waitFor(() => {
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      expect(screen.getByText('Climate Change Dataset')).toBeInTheDocument();
      expect(screen.getByText('Healthcare Analytics')).toBeInTheDocument();
      expect(screen.getByText('Financial Metrics')).toBeInTheDocument();
      expect(screen.getByText('PENDING')).toBeInTheDocument();
      expect(screen.getByText('APPROVED')).toBeInTheDocument();
      expect(screen.getByText('REJECTED')).toBeInTheDocument();
    });
  });

  test('filters requests by status', async () => {
    (fetchWithAuth as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockRequests)
    });
    
    render(<AllRequests />);
    
    await waitFor(() => {
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    });
    
    // Filter by pending status
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'pending' } });
    
    await waitFor(() => {
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
      expect(screen.queryByText('Alice Johnson')).not.toBeInTheDocument();
    });
  });

  test('searches requests by researcher name', async () => {
    (fetchWithAuth as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockRequests)
    });
    
    render(<AllRequests />);
    
    await waitFor(() => {
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    });
    
    // Search for 'Alice'
    fireEvent.change(screen.getByPlaceholderText('Search by researcher name...'), { 
      target: { value: 'Alice' } 
    });
    
    await waitFor(() => {
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    });
  });

  test('navigates to request details when row is clicked', async () => {
    (fetchWithAuth as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockRequests)
    });
    
    render(<AllRequests />);
    
    await waitFor(() => {
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
    
    // Click on the first request row
    fireEvent.click(screen.getByText('Jane Smith').closest('tr')!);
    
    expect(mockRouter.push).toHaveBeenCalledWith('/requests/approval/1');
  });

  test('shows no requests message when filtered results are empty', async () => {
    (fetchWithAuth as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockRequests)
    });
    
    render(<AllRequests />);
    
    await waitFor(() => {
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
    
    // Search for a name that doesn't exist
    fireEvent.change(screen.getByPlaceholderText('Search by researcher name...'), { 
      target: { value: 'Nobody' } 
    });
    
    await waitFor(() => {
      expect(screen.getByText('No requests found.')).toBeInTheDocument();
    });
  });
});