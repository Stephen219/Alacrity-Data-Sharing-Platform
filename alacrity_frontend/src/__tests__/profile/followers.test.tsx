import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useParams } from 'next/navigation';
import FollowersList from '@/app/organisation/followers/[id]/page';
import { fetchWithAuth, fetchUserData } from '@/libs/auth';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
}));

jest.mock('@/libs/auth', () => ({
  fetchWithAuth: jest.fn(),
  fetchUserData: jest.fn(),
}));

jest.mock('next/image', () => ({
  __esModule: true,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: (props: any) => <img {...props} />,
}));

jest.mock('next/link', () => ({
  __esModule: true,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}));

// Sample follower data
const mockFollowers = [
  {
    id: 1,
    username: 'johndoe',
    first_name: 'John',
    sur_name: 'Doe',
    role: 'Researcher',
    field: 'Physics',
    date_joined: '2023-01-01',
    profile_picture: '/john.jpg',
    bio: 'A physicist',
    social_links: [],
    researches: [],
    bookmarked_researches: [],
    followers_count: 100,
    following_count: 50,
    is_followed: false,
    follows_you: false,
    organization: null,
  },
  {
    id: 2,
    username: 'janedoe',
    first_name: 'Jane',
    sur_name: 'Doe',
    role: 'Researcher',
    field: 'Chemistry',
    date_joined: '2023-02-01',
    profile_picture: null,
    bio: 'A chemist',
    social_links: [],
    researches: [],
    bookmarked_researches: [],
    followers_count: 200,
    following_count: 75,
    is_followed: true,
    follows_you: true,
    organization: null,
  },
];

describe('FollowersList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useParams as jest.Mock).mockReturnValue({ id: '123' });
    (fetchUserData as jest.Mock).mockReturnValue({ id: 'current-user' });
  });

  test('renders loading state initially', () => {
    (fetchWithAuth as jest.Mock).mockImplementation(() => new Promise(() => {})); // Never resolve
    render(<FollowersList />);
    expect(screen.getByText('Loading followers...')).toBeInTheDocument();
  });

  test('renders error state when fetch fails', async () => {
    (fetchWithAuth as jest.Mock).mockRejectedValue(new Error('Failed to fetch followers'));
    render(<FollowersList />);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to fetch followers')).toBeInTheDocument();
    });
  });

  test('renders followers list successfully', async () => {
    (fetchWithAuth as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockFollowers,
    });
    
    render(<FollowersList />);
    
    await waitFor(() => {
      expect(screen.getByText('showing 2 followers of 2')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('@johndoe')).toBeInTheDocument();
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
      expect(screen.getByText('@janedoe')).toBeInTheDocument();
    });
  });

  test('displays profile picture when available', async () => {
    (fetchWithAuth as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => [mockFollowers[0]],
    });
    
    render(<FollowersList />);
    
    await waitFor(() => {
      const img = screen.getByAltText('John Doe');
      expect(img).toHaveAttribute('src', '/john.jpg');
    });
  });

  test('displays initials when no profile picture', async () => {
    (fetchWithAuth as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => [mockFollowers[1]],
    });
    
    render(<FollowersList />);
    
    await waitFor(() => {
      expect(screen.getByText('JD')).toBeInTheDocument();
    });
  });

  test('filters followers based on search query', async () => {
    (fetchWithAuth as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockFollowers,
    });
    
    render(<FollowersList />);
    
    await waitFor(() => {
      expect(screen.getByText('showing 2 followers of 2')).toBeInTheDocument();
    });
    
    const searchInput = screen.getByPlaceholderText('Search followers...');
    fireEvent.change(searchInput, { target: { value: 'john' } });
    
    expect(screen.getByText('showing 1 follower of 2')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.queryByText('Jane Doe')).not.toBeInTheDocument();
  });

  test('displays no followers message when search yields no results', async () => {
    (fetchWithAuth as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockFollowers,
    });
    
    render(<FollowersList />);
    
    await waitFor(() => {
      expect(screen.getByText('showing 2 followers of 2')).toBeInTheDocument();
    });
    
    const searchInput = screen.getByPlaceholderText('Search followers...');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
    
    expect(screen.getByText('No followers found matching your search.')).toBeInTheDocument();
  });

  test('navigates to researcher profile when clicking follower', async () => {
    (fetchWithAuth as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => [mockFollowers[0]],
    });
    
    render(<FollowersList />);
    
    await waitFor(() => {
      const link = screen.getByText('John Doe').closest('a');
      expect(link).toHaveAttribute('href', '/researcher/profile/1');
    });
  });

  test('displays correct follower count grammar', async () => {
    (fetchWithAuth as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => [mockFollowers[0]],
    });
    
    render(<FollowersList />);
    
    await waitFor(() => {
      expect(screen.getByText('showing 1 follower of 1')).toBeInTheDocument();
      expect(screen.getByText('100 followers')).toBeInTheDocument();
    });
  });

  test('handles empty followers list', async () => {
    (fetchWithAuth as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => [],
    });
    
    render(<FollowersList />);
    
    await waitFor(() => {
      expect(screen.getByText('No followers found matching your search.')).toBeInTheDocument();
    });
  });

  test('calls fetchFollowers with correct userId', async () => {
    (fetchWithAuth as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockFollowers,
    });
    
    render(<FollowersList />);
    
    await waitFor(() => {
      expect(fetchWithAuth).toHaveBeenCalledWith(
        expect.stringContaining('/users/organisation_followers/123'),
        expect.any(Object)
      );
    });
  });
});