
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ApproveRequest from '@/components/requests/card';
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

describe('ApproveRequest Component', () => {
  const mockRouter = {
    push: jest.fn(),
  };

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    jest.clearAllMocks();
  });

  const mockRequestData = {
    id: 'abc123',
    request_id: 'req-001',
    researcher_name: 'Dr. John Doe',
    researcher_field: 'Data Science',
    researcher_description: 'Research on AI ethics',
    message: 'Requesting access to the dataset for my research',
    dataset_title: 'AI Ethics Dataset',
    dataset_description: 'Dataset containing information related to AI ethics',
    created_at: '2025-04-09T10:00:00Z',
    request_status: 'pending'
  };

  

  test('renders error state when fetch fails', async () => {
    const errorMessage = 'Failed to fetch: 404 Not Found';
    (fetchWithAuth as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));
    
    render(<ApproveRequest requestId="req-001" />);
    
    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  test('renders error when no requestId is provided', async () => {
    render(<ApproveRequest requestId={undefined} />);
    
    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('No request ID provided')).toBeInTheDocument();
    });
  });

  test('displays request details correctly for pending status', async () => {
    (fetchWithAuth as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockRequestData)
    });
    
    render(<ApproveRequest requestId="req-001" />);
    
    await waitFor(() => {
      expect(screen.getByText('Request Details')).toBeInTheDocument();
      expect(screen.getByText('Dr. John Doe')).toBeInTheDocument();
      expect(screen.getByText('Data Science')).toBeInTheDocument();
      expect(screen.getByText('Research on AI ethics')).toBeInTheDocument();
      expect(screen.getByText('AI Ethics Dataset')).toBeInTheDocument();
      expect(screen.getByText('Requesting access to the dataset for my research')).toBeInTheDocument();
      expect(screen.getByText('Pending')).toBeInTheDocument();
      
      // Check for approve and reject buttons
      expect(screen.getByText('Approve')).toBeInTheDocument();
      expect(screen.getByText('Reject')).toBeInTheDocument();
    });
  });

  test('displays request details correctly for approved status', async () => {
    const approvedRequest = {...mockRequestData, request_status: 'approved'};
    (fetchWithAuth as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(approvedRequest)
    });
    
    render(<ApproveRequest requestId="req-001" />);
    
    await waitFor(() => {
      expect(screen.getByText('Approved')).toBeInTheDocument();
      expect(screen.getByText('Revoke')).toBeInTheDocument();
      // Approve and Reject buttons should not be present
      expect(screen.queryByText('Approve')).not.toBeInTheDocument();
      expect(screen.queryByText('Reject')).not.toBeInTheDocument();
    });
  });

  test('displays request details correctly for denied status', async () => {
    const deniedRequest = {...mockRequestData, request_status: 'denied'};
    (fetchWithAuth as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(deniedRequest)
    });
    
    render(<ApproveRequest requestId="req-001" />);
    
    await waitFor(() => {
      expect(screen.getByText('Denied')).toBeInTheDocument();
      // No action buttons should be present except Back
      expect(screen.queryByText('Approve')).not.toBeInTheDocument();
      expect(screen.queryByText('Reject')).not.toBeInTheDocument();
      expect(screen.queryByText('Revoke')).not.toBeInTheDocument();
      expect(screen.getByText('Back')).toBeInTheDocument();
    });
  });

  test('handles approve action correctly', async () => {
    (fetchWithAuth as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockRequestData)
    });
    
    (fetchWithAuth as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true })
    });
    
    render(<ApproveRequest requestId="req-001" />);
    
    await waitFor(() => {
      expect(screen.getByText('Approve')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Approve'));
    
    await waitFor(() => {
      expect(fetchWithAuth).toHaveBeenCalledTimes(2);
      expect(fetchWithAuth).toHaveBeenLastCalledWith(
        'http://test-api.example.com/requests/requestaction/req-001/',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ request_id: 'req-001', action: 'accept' })
        }
      );
      expect(mockRouter.push).toHaveBeenCalledWith('/requests/all');
    });
  });

  test('handles reject action correctly', async () => {
    (fetchWithAuth as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockRequestData)
    });
    
    (fetchWithAuth as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true })
    });
    
    render(<ApproveRequest requestId="req-001" />);
    
    await waitFor(() => {
      expect(screen.getByText('Reject')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Reject'));
    
    await waitFor(() => {
      expect(fetchWithAuth).toHaveBeenCalledTimes(2);
      expect(fetchWithAuth).toHaveBeenLastCalledWith(
        'http://test-api.example.com/requests/requestaction/req-001/',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ request_id: 'req-001', action: 'reject' })
        }
      );
      expect(mockRouter.push).toHaveBeenCalledWith('/requests/all');
    });
  });

  test('handles revoke action correctly', async () => {
    const approvedRequest = {...mockRequestData, request_status: 'approved'};
    (fetchWithAuth as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(approvedRequest)
    });
    
    (fetchWithAuth as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true })
    });
    
    render(<ApproveRequest requestId="req-001" />);
    
    await waitFor(() => {
      expect(screen.getByText('Revoke')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Revoke'));
    
    await waitFor(() => {
      expect(fetchWithAuth).toHaveBeenCalledTimes(2);
      expect(fetchWithAuth).toHaveBeenLastCalledWith(
        'http://test-api.example.com/requests/requestaction/req-001/',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ request_id: 'req-001', action: 'revoke' })
        }
      );
      expect(mockRouter.push).toHaveBeenCalledWith('/requests/all');
    });
  });

  test('handles back button click correctly', async () => {
    (fetchWithAuth as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockRequestData)
    });
    
    render(<ApproveRequest requestId="req-001" />);
    
    await waitFor(() => {
      expect(screen.getByText('Back')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Back'));
    
    expect(mockRouter.push).toHaveBeenCalledWith('/requests/all');
  });

  test('handles action error correctly', async () => {
    (fetchWithAuth as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockRequestData)
    });
    
    (fetchWithAuth as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      text: () => Promise.resolve('Server error')
    });
    
    render(<ApproveRequest requestId="req-001" />);
    
    await waitFor(() => {
      expect(screen.getByText('Approve')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Approve'));
    
    await waitFor(() => {
      expect(screen.getByText(/Action failed:/)).toBeInTheDocument();
    });
  });

  test('shows no request details found when data is null', async () => {
    (fetchWithAuth as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(null)
    });
    
    render(<ApproveRequest requestId="req-001" />);
    
    await waitFor(() => {
      expect(screen.getByText('No request details found')).toBeInTheDocument();
    });
  });
});