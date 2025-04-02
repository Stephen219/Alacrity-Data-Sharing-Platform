
import { render, screen, waitFor } from '@testing-library/react';
import AdminDashboard from '@/components/dashboards/admin';
import { fetchWithAuth, fetchUserData } from '@/libs/auth';

// Mocking Next.js Link component
jest.mock('next/link', () => {
  // eslint-disable-next-line react/display-name
  return ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>;
});

// Mocking Next.js navigation hooks (App Router)
jest.mock('next/navigation', () => ({
  useRouter: jest.fn().mockReturnValue({
    push: jest.fn(),
    pathname: '/dashboard',
    route: '/dashboard',
    query: {},
    asPath: '/dashboard',
  }),
}));

// Mocking auth library
jest.mock('@/libs/auth', () => ({
  fetchWithAuth: jest.fn(),
  fetchUserData: jest.fn(),
}));

// Mocking chart.js
jest.mock('react-chartjs-2', () => ({
  Line: () => <div data-testid="mock-chart">Mock Chart</div>,
}));

// Mocking configuration
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

  const mockAnalyticsData = {
    daily_trends: [
      { day: '2025-03-01', views: 10, downloads: 5, bookmarks: 2 },
      { day: '2025-03-02', views: 15, downloads: 8, bookmarks: 3 },
    ],
    time_range: 'Last 30 Days',
  };

  const mockPendingSubmissions = [
    {
      id: 1,
      title: 'Test Submission',
      description: 'Test Description',
      researcher_email: 'test@example.com',
      submitted_at: '2025-03-01T12:00:00Z',
      status: 'pending',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock all fetch calls
    (fetchWithAuth as jest.Mock).mockImplementation((url) => {
      if (url.includes('/users/dashboard')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockDashboardData),
        });
      } else if (url.includes('/research/submissions/pending/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockPendingSubmissions),
        });
      } else if (url.includes('/datasets/dataset-analytics-card/dash/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockAnalyticsData),
        });
      }
      
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
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
    }, { timeout: 2000 });
    
    // Verify key elements
    expect(screen.getByText('Total Datasets')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument(); // Total datasets value
  });

  test('displays error state when fetch fails', async () => {
    (fetchWithAuth as jest.Mock).mockImplementation((url) => {
      if (url.includes('/users/dashboard')) {
        return Promise.reject(new Error('Fetch failed'));
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });
    
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
    }, { timeout: 2000 });
    
    expect(screen.queryByText('Active Employees')).not.toBeInTheDocument();
  });

  test('renders no data message when data is null', async () => {
    (fetchWithAuth as jest.Mock).mockImplementation((url) => {
      if (url.includes('/users/dashboard')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(null),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });
    
    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText('No data available')).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  test('renders table headers for pending access requests', async () => {
    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Organization Dashboard')).toBeInTheDocument();
    }, { timeout: 2000 });
    
    expect(screen.getByText('Requester')).toBeInTheDocument();
    expect(screen.getByText('Dataset')).toBeInTheDocument();
    expect(screen.getByText('Date')).toBeInTheDocument();
    expect(screen.getAllByText('Status')[0]).toBeInTheDocument();
  });

  test('renders dataset analytics dropdown', async () => {
    render(<AdminDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Organization Dashboard')).toBeInTheDocument();
    }, { timeout: 2000 });
    
    expect(screen.getByText('Last 30 Days')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });
});