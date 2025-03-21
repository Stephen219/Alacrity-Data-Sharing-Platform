import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import ApproveRequest from '@/components/requests/card'; // Adjust the import path as needed
import { fetchWithAuth } from '@/libs/auth';
import { BACKEND_URL } from '../../config';

// Mock the next/navigation hook
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock the fetchWithAuth function
jest.mock('@/libs/auth', () => ({
  fetchWithAuth: jest.fn(),
}));

describe('ApproveRequest Component', () => {
  // Mock router
  const mockPush = jest.fn();
  const mockRouter = { push: mockPush };
  
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  const mockRequestData = {
    id: '123',
    request_id: 'REQ-123',
    researcher_name: 'Dr. Jane Smith',
    researcher_field: 'Genomics',
    researcher_description: 'Researching genetic markers for disease prevention',
    message: 'Need access to dataset for genetic research',
    dataset_title: 'Human Genome Project Data',
    dataset_description: 'Complete human genome sequencing data',
    created_at: '2025-03-10T12:00:00Z'
  };

  test('should display loading state initially', () => {
    // Mock the fetch to never resolve
    (fetchWithAuth as jest.Mock).mockImplementation(() => new Promise(() => {}));
    
    render(<ApproveRequest requestId="REQ-123" />);
    
    expect(screen.getByText('Loading request details...')).toBeInTheDocument();
  });

  test('should display error when request ID is missing', async () => {
    render(<ApproveRequest requestId={undefined} />);
    
    await waitFor(() => {
      expect(screen.getByText('Error: No request ID provided')).toBeInTheDocument();
    });
  });

  test('should display error when API call fails', async () => {
    (fetchWithAuth as jest.Mock).mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found'
    });
    
    render(<ApproveRequest requestId="REQ-123" />);
    
    await waitFor(() => {
      expect(screen.getByText('Error: Failed to fetch: 404 Not Found')).toBeInTheDocument();
    });
  });

  test('should display request details when loaded successfully', async () => {
    (fetchWithAuth as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockRequestData)
    });
    
    render(<ApproveRequest requestId="REQ-123" />);
    
    await waitFor(() => {
      expect(screen.getByText('Request Details')).toBeInTheDocument();
      expect(screen.getByText('REQ-123')).toBeInTheDocument();
      expect(screen.getByText('Dr. Jane Smith', { exact: false })).toBeInTheDocument();
      expect(screen.getByText('Genomics', { exact: false })).toBeInTheDocument();
      expect(screen.getByText('Need access to dataset for genetic research', { exact: false })).toBeInTheDocument();
    });
  });

  test('should handle approve action correctly', async () => {
    (fetchWithAuth as jest.Mock).mockImplementation((url, options) => {
      if (options && options.method === 'POST') {
        return Promise.resolve({ ok: true });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockRequestData)
      });
    });
    
    render(<ApproveRequest requestId="REQ-123" />);
    
    await waitFor(() => {
      expect(screen.getByText('Approve')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Approve'));
    
    await waitFor(() => {
      expect(fetchWithAuth).toHaveBeenCalledWith(
        `${BACKEND_URL}/requests/requestaction/REQ-123/`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ request_id: 'REQ-123', action: 'accept' })
        })
      );
      expect(mockPush).toHaveBeenCalledWith('/requests/pending');
    });
  });

  test('should handle reject action correctly', async () => {
    (fetchWithAuth as jest.Mock).mockImplementation((url, options) => {
      if (options && options.method === 'POST') {
        return Promise.resolve({ ok: true });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockRequestData)
      });
    });
    
    render(<ApproveRequest requestId="REQ-123" />);
    
    await waitFor(() => {
      expect(screen.getByText('Reject')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Reject'));
    
    await waitFor(() => {
      expect(fetchWithAuth).toHaveBeenCalledWith(
        `${BACKEND_URL}/requests/requestaction/REQ-123/`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ request_id: 'REQ-123', action: 'reject' })
        })
      );
      expect(mockPush).toHaveBeenCalledWith('/requests/pending');
    });
  });

  test('should navigate back when back button is clicked', async () => {
    (fetchWithAuth as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockRequestData)
    });
    
    render(<ApproveRequest requestId="REQ-123" />);
    
    await waitFor(() => {
      expect(screen.getByText('Back')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Back'));
    
    expect(mockPush).toHaveBeenCalledWith('/requests/pending');
  });

  test('should handle error during action', async () => {
    // First mock the fetch for loading the data
    (fetchWithAuth as jest.Mock).mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockRequestData)
      })
    );
    
    // Then mock the fetch for the action to fail
    (fetchWithAuth as jest.Mock).mockImplementationOnce(() => 
      Promise.resolve({
        ok: false,
        status: 500,
        statusText: 'Server Error',
        text: () => Promise.resolve('Internal server error')
      })
    );
    
    render(<ApproveRequest requestId="REQ-123" />);
    
    await waitFor(() => {
      expect(screen.getByText('Approve')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Approve'));
    
    await waitFor(() => {
      expect(screen.getByText('Error: Action failed: 500 Server Error - Internal server error')).toBeInTheDocument();
    });
  });

  test('should display "No request details found" when response is empty', async () => {
    (fetchWithAuth as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(null)
    });
    
    render(<ApproveRequest requestId="REQ-123" />);
    
    await waitFor(() => {
      expect(screen.getByText('No request details found')).toBeInTheDocument();
    });
  });
});