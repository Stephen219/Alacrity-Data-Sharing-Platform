
import { render, screen, waitFor } from '@testing-library/react';
import AdminDashboard from '@/components/dashboards/admin';
import { fetchWithAuth, fetchUserData } from '@/libs/auth';


jest.mock('next/link', () => {
  // eslint-disable-next-line react/display-name
  return ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>;
});


jest.mock('@/libs/auth', () => ({
  fetchWithAuth: jest.fn(),
  fetchUserData: jest.fn(),
}));


jest.mock('@/config', () => ({
  BACKEND_URL: 'http://mock-backend.com',
}));

describe('AdminDashboard', () => {
  const mockDashboardData = {
    total_datasets: 10,
    total_users: 5,
    pending_requests: 3,
    approved_requests: 7,
    total_researches: 15,
    pending_datasets: [
      {
        request_id: '1',
        dataset_id_id: 'dataset1',
        dataset_id__title: 'Test Dataset',
        researcher_id_id: 1,
        researcher_id__first_name: 'John',
        researcher_id__sur_name: 'Doe',
        researcher_id__profile_picture: 'http://example.com/john.jpg',
        request_status: 'pending',
        created_at: '2025-03-01T12:00:00Z',
      },
    ],
  };

  const mockUserData = {
    role: 'organization_admin',
    id: 1,
    name: 'Admin User',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (fetchWithAuth as jest.Mock).mockResolvedValue({
      json: jest.fn().mockResolvedValue(mockDashboardData),
    });
    (fetchUserData as jest.Mock).mockResolvedValue(mockUserData);
  });

  test('renders loading state initially', () => {
    render(<AdminDashboard />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('renders dashboard structure after fetch', async () => {
    render(<AdminDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Organization Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Overview of your organization datasets and activities')).toBeInTheDocument();
    }, { timeout: 2000 });
  });


  test('displays error state when fetch fails', async () => {
    (fetchWithAuth as jest.Mock).mockRejectedValue(new Error('Fetch failed'));
    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Error:/)).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  test('does not display Active Employees card when user is not an organization_admin', async () => {
    (fetchUserData as jest.Mock).mockResolvedValue({ role: 'researcher' });
    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Organization Dashboard')).toBeInTheDocument();
      expect(screen.queryByText('Active Employees')).not.toBeInTheDocument();
    }, { timeout: 2000 });
  });

  test('renders no data message when data is null', async () => {
    (fetchWithAuth as jest.Mock).mockResolvedValue({
      json: jest.fn().mockResolvedValue(null),
    });
    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText('No data available')).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  test('renders table headers for pending access requests', async () => {
    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Requester')).toBeInTheDocument();
      expect(screen.getByText('Dataset')).toBeInTheDocument();
      expect(screen.getByText('Date')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Action')).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  test('renders dataset analytics dropdown', async () => {
    render(<AdminDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Last 30 Days')).toBeInTheDocument();
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    }, { timeout: 2000 });
  });
});