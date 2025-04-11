import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import FollowersList from '@/app/researcher/followers/[id]/page';
import {  fetchWithAuth } from '@/libs/auth';
import { BACKEND_URL } from '@/config';
import { JSX, ClassAttributes, ImgHTMLAttributes } from 'react';

jest.mock('next/navigation', () => ({
  useParams: jest.fn().mockReturnValue({ id: '123' }),
  useRouter: jest.fn().mockReturnValue({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));


jest.mock('@/libs/auth', () => ({
  fetchUserData: jest.fn().mockReturnValue({ id: '456', username: 'testuser' }),
  fetchWithAuth: jest.fn(),
}));

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: JSX.IntrinsicAttributes & ClassAttributes<HTMLImageElement> & ImgHTMLAttributes<HTMLImageElement>) => <img {...props} alt={props.alt || ''} />,
}));

// Mock next/link
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

describe('FollowersList Component', () => {
  const mockFollowers = [
    {
      id: 1,
      username: 'johndoe',
      first_name: 'John',
      sur_name: 'Doe',
      role: 'researcher',
      field: 'Computer Science',
      date_joined: '2023-01-01',
      profile_picture: '/profiles/john.jpg',
      bio: 'Research in AI',
      social_links: [],
      researches: [],
      bookmarked_researches: [],
      followers_count: 120,
      following_count: 85,
      is_followed: true,
      follows_you: false,
      organization: null,
    },
    {
      id: 2,
      username: 'janefoster',
      first_name: 'Jane',
      sur_name: 'Foster',
      role: 'professor',
      field: 'Biology',
      date_joined: '2023-02-15',
      profile_picture: null,
      bio: 'Research in microbiology',
      social_links: [],
      researches: [],
      bookmarked_researches: [],
      followers_count: 250,
      following_count: 120,
      is_followed: false,
      follows_you: true,
      organization: { id: 1, name: 'University of Science' },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  
  });

  test('renders loading state initially', () => {
  
    (fetchWithAuth as jest.Mock).mockReturnValue(new Promise(() => {}));
    
    render(<FollowersList />);
    
    expect(screen.getByText('Loading followers...')).toBeInTheDocument();
  });

  test('renders followers list when data is fetched successfully', async () => {
    (fetchWithAuth as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockFollowers,
    });
    
    render(<FollowersList />);
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('@johndoe')).toBeInTheDocument();
      expect(screen.getByText('Jane Foster')).toBeInTheDocument();
      expect(screen.getByText('@janefoster')).toBeInTheDocument();
      expect(screen.getByText('Computer Science')).toBeInTheDocument();
      expect(screen.getByText('Biology')).toBeInTheDocument();
    });
    
    expect(screen.getByText('showing 2 followers of 2')).toBeInTheDocument();
  });

  test('displays error message when fetch fails', async () => {
    (fetchWithAuth as jest.Mock).mockResolvedValue({
      ok: false,
    });
    
    render(<FollowersList />);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to fetch followers')).toBeInTheDocument();
    });
  });

  test('filters followers based on search query by name', async () => {
    (fetchWithAuth as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockFollowers,
    });
    
    render(<FollowersList />);
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Foster')).toBeInTheDocument();
    });
    
    // Search for 'John'
    fireEvent.change(screen.getByPlaceholderText('Search followers...'), {
      target: { value: 'John' },
    });
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.queryByText('Jane Foster')).not.toBeInTheDocument();
    expect(screen.getByText('showing 1 follower of 2')).toBeInTheDocument();
  });

  test('filters followers based on search query by field', async () => {
    (fetchWithAuth as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockFollowers,
    });
    
    render(<FollowersList />);
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Foster')).toBeInTheDocument();
    });
    
    // Search for 'Biology' (field)
    fireEvent.change(screen.getByPlaceholderText('Search followers...'), {
      target: { value: 'Biology' },
    });
    
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    expect(screen.getByText('Jane Foster')).toBeInTheDocument();
    expect(screen.getByText('showing 1 follower of 2')).toBeInTheDocument();
  });

  test('filters followers based on search query by username', async () => {
    (fetchWithAuth as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockFollowers,
    });
    
    render(<FollowersList />);
    
    await waitFor(() => {
      expect(screen.getByText('@johndoe')).toBeInTheDocument();
      expect(screen.getByText('@janefoster')).toBeInTheDocument();
    });
    
    // Search for username
    fireEvent.change(screen.getByPlaceholderText('Search followers...'), {
      target: { value: 'janefos' },
    });
    
    expect(screen.queryByText('@johndoe')).not.toBeInTheDocument();
    expect(screen.getByText('@janefoster')).toBeInTheDocument();
  });

  test('displays "no followers found" message when search returns no results', async () => {
    (fetchWithAuth as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockFollowers,
    });
    
    render(<FollowersList />);
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
    
    // Search for something that doesn't exist
    fireEvent.change(screen.getByPlaceholderText('Search followers...'), {
      target: { value: 'xyz123' },
    });
    
    expect(screen.getByText('No followers found matching your search.')).toBeInTheDocument();
  });

  test('fetches followers with the correct user ID from params', async () => {
    // Override the useParams mock for this specific test
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('next/navigation').useParams.mockReturnValue({ id: '789' });
    
    (fetchWithAuth as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockFollowers,
    });
    
    render(<FollowersList />);
    
    await waitFor(() => {
      expect(fetchWithAuth).toHaveBeenCalledWith(
        `${BACKEND_URL}/users/followers/789`,
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });
  });

  test('renders profile initials when profile picture is null', async () => {
    (fetchWithAuth as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockFollowers,
    });
    
    render(<FollowersList />);
    
    await waitFor(() => {
      
      const initialsElement = screen.getByText('JF');
      expect(initialsElement).toBeInTheDocument();
    });
  });

  test('renders follower count text correctly (plural vs singular)', async () => {
    const singleFollowerUser = {
      ...mockFollowers[0],
      followers_count: 1
    };
    
    (fetchWithAuth as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => [singleFollowerUser],
    });
    
    render(<FollowersList />);
    
    await waitFor(() => {
      expect(screen.getByText('1 follower')).toBeInTheDocument();
      expect(screen.getByText('showing 1 follower of 1')).toBeInTheDocument();
    });
  });

  test('handles fetch error with custom error message', async () => {
    (fetchWithAuth as jest.Mock).mockRejectedValue(new Error('Network error'));
    
    render(<FollowersList />);
    
    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  test('renders empty followers list', async () => {
    (fetchWithAuth as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => [],
    });
    
    render(<FollowersList />);
    
    await waitFor(() => {
      expect(screen.queryByText('showing 0 followers of 0')).not.toBeInTheDocument();
      expect(screen.queryByText('No followers found matching your search.')).toBeInTheDocument();
    });
  });

  test('uses search input to filter when user types', async () => {
    (fetchWithAuth as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockFollowers,
    });
    
    render(<FollowersList />);
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
    
    const searchInput = screen.getByPlaceholderText('Search followers...');
    
    // Type character by character
    fireEvent.change(searchInput, { target: { value: 'j' } });
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Foster')).toBeInTheDocument();
    
    fireEvent.change(searchInput, { target: { value: 'jo' } });
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.queryByText('Jane Foster')).not.toBeInTheDocument();
  });

  test('links to correct profile page when clicking on a follower', async () => {
    (fetchWithAuth as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockFollowers,
    });
    
    render(<FollowersList />);
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
    
    const johnDoeLink = screen.getByText('John Doe').closest('a');
    expect(johnDoeLink).toHaveAttribute('href', '/researcher/profile/1');
    
    const janeFosterLink = screen.getByText('Jane Foster').closest('a');
    expect(janeFosterLink).toHaveAttribute('href', '/researcher/profile/2');
  });
});