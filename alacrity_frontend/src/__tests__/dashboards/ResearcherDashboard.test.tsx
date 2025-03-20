



import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import ResearcherDashboard from '@/components/dashboards/researcher';
import { fetchWithAuth } from '@/libs/auth';

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(), 
  }),
}))

jest.mock('@/libs/auth', () => ({
  fetchWithAuth: jest.fn(),
}));

jest.mock('@/config', () => ({
  BACKEND_URL: 'http://mock-backend.com',
}));

describe('ResearcherDashboard', () => {
  const mockDashboardData = {
    datasets_accessed: 5,
    pending_reviews: 2,
    research_submitted: 3,
    requests_approved: 4,
    all_datasets_requests: [
      {
        request_id: '1',
        dataset_id_id: 'dataset1',
        dataset_id__title: 'Test Dataset',
        researcher_id__profile_picture: 'http://example.com/profile.jpg',
        request_status: 'approved',
        created_at: '2025-03-01T12:00:00Z',
        updated_at: '2025-03-02T12:00:00Z',
      },
    ],
    datasets_having_access: [
      {
        dataset_id: '1',
        title: 'Mock Dataset',
        description: 'A mock dataset for testing',
        tags: ['Mock', 'Test'],
        contributor_id__organization__name: 'Mock Org',
        requests__updated_at: '2025-03-01T12:00:00Z',
        category: 'Test',
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (fetchWithAuth as jest.Mock).mockResolvedValue({
      json: jest.fn().mockResolvedValue(mockDashboardData),
    });
  });

  test('renders loading state initially', () => {
    render(<ResearcherDashboard />);
    expect(screen.getByText('Loading dashboard data...')).toBeInTheDocument();
  });

  test('renders dashboard structure after fetch', async () => {
    render(<ResearcherDashboard />);
    await waitFor(() => {
      expect(screen.getByText('Researcher Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Dataset Feed')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Search datasets...')).toBeInTheDocument();
    });
  });

  test('renders MetricCard values correctly', async () => {
    render(<ResearcherDashboard />);
    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('4')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  test('displays error state when fetch fails', async () => {
    (fetchWithAuth as jest.Mock).mockRejectedValue(new Error('Fetch failed'));
    render(<ResearcherDashboard />);
    await waitFor(() => {
      expect(screen.getByText('Error loading dashboard data. Please try again.')).toBeInTheDocument();
    });
  });

  test('renders empty state when no API data is available', async () => {
    (fetchWithAuth as jest.Mock).mockResolvedValue({
      json: jest.fn().mockResolvedValue({
        ...mockDashboardData,
        datasets_having_access: [],
      }),
    });
    render(<ResearcherDashboard />);
    await waitFor(() => {
      expect(screen.getByText('No datasets found')).toBeInTheDocument();
    });
  });

  test('filters datasets based on search query', async () => {
    render(<ResearcherDashboard />);
    await waitFor(() => {
      expect(screen.getByText('Mock Dataset')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search datasets...');
    fireEvent.change(searchInput, { target: { value: 'mock' } });
    await waitFor(() => {
      expect(screen.getByText('Mock Dataset')).toBeInTheDocument();
      expect(screen.queryByText('No datasets found')).not.toBeInTheDocument();
    });

    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
    await waitFor(() => {
      expect(screen.queryByText('Mock Dataset')).not.toBeInTheDocument();
      expect(screen.getByText('No datasets found')).toBeInTheDocument();
    });
  });

  test('renders and switches between tabs', async () => {
    render(<ResearcherDashboard />);
    await waitFor(() => {
      expect(screen.getByText('Publication Tracker')).toBeInTheDocument();
      expect(screen.getByText('Dataset Recommendations')).toBeInTheDocument();
      expect(screen.getByText('Research Timeline')).toBeInTheDocument();
    });

    expect(screen.getByText('Track and manage your research publications')).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByText('Dataset Recommendations'));
    });
    await waitFor(() => {
      expect(screen.getByText('Based on your research interests and recent activity, we recommend these datasets:')).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Research Timeline'));
    });
    await waitFor(() => {
      expect(screen.getByText('Upcoming research milestones and deadlines:')).toBeInTheDocument();
    });
  });

  test('renders dataset card with correct data', async () => {
    render(<ResearcherDashboard />);
    await waitFor(() => {
      expect(screen.getByText('Mock Dataset')).toBeInTheDocument();
      expect(screen.getByText('A mock dataset for testing')).toBeInTheDocument();
      expect(screen.getByText('Mock Org')).toBeInTheDocument();
      expect(screen.getByText('Mock')).toBeInTheDocument();
      expect(screen.getByText('Test')).toBeInTheDocument();
      expect(screen.getByText('Mar 1, 2025')).toBeInTheDocument();
      expect(screen.getByText('Analyze')).toBeInTheDocument();
    });
  });


  test('renders recommendations tab content', async () => {
    render(<ResearcherDashboard />);
    await waitFor(() => {
      expect(screen.getByText('Dataset Recommendations')).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Dataset Recommendations'));
    });
    await waitFor(() => {
      expect(screen.getByText('Global Climate Data 2023')).toBeInTheDocument();
      expect(screen.getByText('Environmental Science')).toBeInTheDocument();
      expect(screen.getByText('98% match')).toBeInTheDocument();
      expect(screen.getByText('342 researchers')).toBeInTheDocument();
    });
  });

  test('renders timeline tab content', async () => {
    render(<ResearcherDashboard />);
    await waitFor(() => {
      expect(screen.getByText('Research Timeline')).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Research Timeline'));
    });
    await waitFor(() => {
      expect(screen.getByText('Research Proposal Deadline')).toBeInTheDocument();
      expect(screen.getByText('Urban Data Analysis')).toBeInTheDocument();
      expect(screen.getByText('Due: May 15, 2023')).toBeInTheDocument();
      expect(screen.getByText('12d')).toBeInTheDocument();
    });
  });
});