/* eslint-disable @typescript-eslint/no-require-imports */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useRouter, useParams } from 'next/navigation';
import ResearcherProfilePage from '../../app/researcher/profile/[id]/page'; 
import { fetchWithAuth, fetchUserData } from '@/libs/auth';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
}));

jest.mock('@/libs/auth', () => ({
  fetchWithAuth: jest.fn(),
  fetchUserData: jest.fn(),
  useAuth: jest.fn(), 
}));

jest.mock('html-react-parser', () => (text: string) => text);

// Mock AuthContext provider
const mockAuthContextValue = {
  user: { id: '1', role: 'researcher' }, 
  loading: false,
  logout: jest.fn(),
};

const AuthProviderWrapper = ({ children }: { children: React.ReactNode }) => (
  <div>{children}</div> 
);

describe('ResearcherProfilePage', () => {
  const mockRouter = { push: jest.fn() };
  const mockUser = {
    id: '1',
    email: 'user@example.com',
    username: 'testuser',
    firstname: 'Test',
    lastname: 'User',
    profile_picture: null,
    date_joined: '2023-01-01',
    bio: 'Test bio',
    phonenumber: '1234567890',
    role: 'researcher',
    organization: 'Test Org',
    field: 'Science',
    researches: [
      { id: 'r1', title: 'Research 1', description: 'Desc 1', status: 'published', submitted_at: '2023-01-02', is_private: false },
    ],
    bookmarked_researches: [
      { id: 'b1', title: 'Bookmark 1', description: 'Bookmark Desc 1', publisher: 'Pub', date: '2023-01-03' },
    ],
    followers_count: 10,
    following_count: 5,
    social_links: ['https://linkedin.com/in/testuser'],
    is_followed: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useParams as jest.Mock).mockReturnValue({ id: '1' });
    (fetchUserData as jest.Mock).mockResolvedValue(mockUser);
    (require('@/libs/auth').useAuth as jest.Mock).mockReturnValue(mockAuthContextValue);
    (fetchWithAuth as jest.Mock).mockImplementation((url, options) => {
      if (url.includes('/users/profile/1/')) {
        if (options?.method === 'PUT') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ ...mockUser, firstname: 'Updated' }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockUser),
        });
      }
      if (url.includes('/users/profile_pic_update/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ profile_picture: 'new-pic.jpg' }),
        });
      }
      if (url.includes('/users/follow/1/')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });
  });

  test('renders loading state initially', () => {
    render(<ResearcherProfilePage />, { wrapper: AuthProviderWrapper });
    expect(screen.getByText('Loading profile...')).toBeInTheDocument();
  });

 
  test('renders not found state for invalid role', async () => {
    (fetchWithAuth as jest.Mock).mockImplementation((url) => {
      if (url.includes('/users/profile/1/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ ...mockUser, role: 'contributor' }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockUser),
      });
    });
    render(<ResearcherProfilePage />, { wrapper: AuthProviderWrapper });
    await waitFor(() => {
      expect(screen.getByText('Profile not found')).toBeInTheDocument();
    });
  });

  test('renders profile details for owner', async () => {
    render(<ResearcherProfilePage />, { wrapper: AuthProviderWrapper });
    await waitFor(() => {
      expect(screen.getByText('Researcher Profile')).toBeInTheDocument();
      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('@testuser')).toBeInTheDocument();
      expect(screen.getByText('Test bio')).toBeInTheDocument();
      expect(screen.getByText('Edit Profile')).toBeInTheDocument();
    });
  });

  test('renders profile details for non-owner with follow button', async () => {
    (fetchUserData as jest.Mock).mockResolvedValue({ ...mockUser, id: '2' });
    (require('@/libs/auth').useAuth as jest.Mock).mockReturnValue({
      ...mockAuthContextValue,
      user: { id: '2', role: 'researcher' },
    });
    render(<ResearcherProfilePage />, { wrapper: AuthProviderWrapper });
    await waitFor(() => {
      expect(screen.getByText('Follow')).toBeInTheDocument();
      expect(screen.queryByText('user@example.com')).not.toBeInTheDocument();
    });
  });

  test('toggles edit mode and updates profile', async () => {
    render(<ResearcherProfilePage />, { wrapper: AuthProviderWrapper });
    await waitFor(() => {
      fireEvent.click(screen.getByText('Edit Profile'));
      const firstnameInput = screen.getByLabelText('First Name');
      fireEvent.change(firstnameInput, { target: { value: 'Updated' } });
      fireEvent.click(screen.getByText('Save'));
    });
    await waitFor(() => {
      expect(screen.getByText('Updated User')).toBeInTheDocument();
    });
  });



  test('toggles between research and bookmarks tabs', async () => {
    render(<ResearcherProfilePage />, { wrapper: AuthProviderWrapper });
    await waitFor(() => {
      expect(screen.getByText('Research 1')).toBeInTheDocument();
      fireEvent.click(screen.getByText('Bookmarks'));
      expect(screen.getByText('Bookmark 1')).toBeInTheDocument();
    });
  });

  
  test('adds and removes social links in edit mode', async () => {
    render(<ResearcherProfilePage />, { wrapper: AuthProviderWrapper });
    await waitFor(() => {
      fireEvent.click(screen.getByText('Edit Profile'));
      const addInput = screen.getByPlaceholderText('https://linkedin.com/in/username');
      fireEvent.change(addInput, { target: { value: 'https://twitter.com/newuser' } });
      fireEvent.click(screen.getByText('Add'));
      expect(screen.getByDisplayValue('https://twitter.com/newuser')).toBeInTheDocument();
      const removeButtons = screen.getAllByLabelText('Remove social link');
      fireEvent.click(removeButtons[1]);
      expect(screen.queryByDisplayValue('https://twitter.com/newuser')).not.toBeInTheDocument();
    });
  });

  test('navigates to research submission on view click', async () => {
    render(<ResearcherProfilePage />, { wrapper: AuthProviderWrapper });
    await waitFor(() => {
      fireEvent.click(screen.getByText('View Full Paper'));
      expect(mockRouter.push).toHaveBeenCalledWith('/researcher/Submissions/view/r1');
    });
  });
});