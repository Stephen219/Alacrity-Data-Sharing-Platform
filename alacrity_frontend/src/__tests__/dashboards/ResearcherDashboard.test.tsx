import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import ResearcherDashboard from '@/components/dashboards/researcher';
import { fetchWithAuth } from '@/libs/auth';

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
        id: '1',
        title: 'Mock Dataset',
        description: 'A mock dataset for testing',
        tags: ['Mock', 'Test'],
        organization: 'Mock Org',
        created_at: '2025-03-01T12:00:00Z',
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
    }, { timeout: 2000 });
  });

  test('renders MetricCard titles without checking dynamic values', async () => {
    render(<ResearcherDashboard />);

    await waitFor(() => {
      const metricTitles = [
        'Datasets Accessed',
        'Requests Approved',
        'Pending Reviews',
        'Research Submitted',
      ];
      metricTitles.forEach((title) => {
        expect(screen.getByText(title)).toBeInTheDocument();
      });
    }, { timeout: 2000 });
  });

  test('displays error state when fetch fails', async () => {
    (fetchWithAuth as jest.Mock).mockRejectedValue(new Error('Fetch failed'));
    render(<ResearcherDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Error loading dashboard data. Please try again.')).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  test('renders dataset feed with sample data when no API data is available', async () => {
    (fetchWithAuth as jest.Mock).mockResolvedValue({
      json: jest.fn().mockResolvedValue({ datasets_having_access: [] }), // Empty API data
    });
    render(<ResearcherDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Healthcare Demographics 2024')).toBeInTheDocument();
      expect(screen.getByText('Climate Change Patterns')).toBeInTheDocument();
      expect(screen.getAllByText('Analyze').length).toBeGreaterThan(0);
    }, { timeout: 2000 });
  });

  test('filters datasets based on search query', async () => {
    render(<ResearcherDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Mock Dataset')).toBeInTheDocument();
    }, { timeout: 2000 });

    const searchInput = screen.getByPlaceholderText('Search datasets...');
    fireEvent.change(searchInput, { target: { value: 'mock' } });

    await waitFor(() => {
      expect(screen.getByText('Mock Dataset')).toBeInTheDocument();
      expect(screen.queryByText('No datasets match your search criteria')).not.toBeInTheDocument();
    });

    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
    await waitFor(() => {
      expect(screen.getByText('No datasets match your search criteria')).toBeInTheDocument();
    });
  });

  test('renders tabs and switches content', async () => {
    render(<ResearcherDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Publication Tracker')).toBeInTheDocument();
      expect(screen.getByText('Dataset Recommendations')).toBeInTheDocument();
      expect(screen.getByText('Research Timeline')).toBeInTheDocument();
    }, { timeout: 2000 });

    // Default tab: Publication Tracker
    expect(screen.getByText('Track and manage your research publications')).toBeInTheDocument();
    expect(screen.getByText('New Publication')).toBeInTheDocument();

    // Switch to Dataset Recommendations
    fireEvent.click(screen.getByText('Dataset Recommendations'));
    await waitFor(() => {
      expect(screen.getByText('Based on your research interests and recent activity, we recommend these datasets:')).toBeInTheDocument();
      expect(screen.getByText('Global Climate Data 2023')).toBeInTheDocument();
    });

    // Switch to Research Timeline
    fireEvent.click(screen.getByText('Research Timeline'));
    await waitFor(() => {
      expect(screen.getByText('Upcoming research milestones and deadlines:')).toBeInTheDocument();
      expect(screen.getByText('Research Proposal Deadline')).toBeInTheDocument();
    });
  });

  test('renders publication table headers', async () => {
    render(<ResearcherDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Journal/Conference')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Metrics')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    }, { timeout: 2000 });
  });
});