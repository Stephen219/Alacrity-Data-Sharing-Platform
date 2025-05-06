import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OrganizationProfilePage from '@/app/organisation/profile/[id]/page';
import { fetchWithAuth } from '@/libs/auth';
import { BACKEND_URL } from '@/config';


jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
  useParams: () => ({
    id: 'test-org-id'
  }),
}));


jest.mock('@/libs/auth', () => ({
  fetchWithAuth: jest.fn(),
}));


global.FormData = class extends FormData {
  append = jest.fn();
  delete = jest.fn();
  get = jest.fn();
  getAll = jest.fn();
  has = jest.fn();
  set = jest.fn();
  forEach = jest.fn();
};


const mockOrganization = {
  Organization_id: 'test-org-id',
  name: 'Test Organization',
  profile_picture: 'https://example.com/profile.jpg',
  cover_image: 'https://example.com/cover.jpg',
  bio: 'This is a test organization',
  date_joined: '2023-01-01T00:00:00.000Z',
  website: 'https://testorg.com',
  location: 'Test Location',
  followers_count: 100,
  following_count: 50,
  datasets_count: 10,
  is_followed: false,
  social_links: [
    { platform: 'linkedin', url: 'https://linkedin.com/company/testorg' },
    { platform: 'twitter', url: 'https://twitter.com/testorg' }
  ]
};

const mockDatasets = [
  {
    dataset_id: 'dataset-1',
    title: 'Test Dataset 1',
    description: 'This is test dataset 1',
    created_at: '2023-01-01T00:00:00.000Z',
    updated_at: '2023-01-15T00:00:00.000Z',
    view_count: 1000,
    tags: ['tag1', 'tag2']
  },
  {
    dataset_id: 'dataset-2',
    title: 'Test Dataset 2',
    description: 'This is test dataset 2',
    created_at: '2023-02-01T00:00:00.000Z',
    updated_at: '2023-02-15T00:00:00.000Z',
    view_count: 2000,
    tags: ['tag3', 'tag4']
  }
];

describe('OrganizationProfilePage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders loading state initially', () => {
    
    (fetchWithAuth as jest.Mock).mockImplementation(() => new Promise(() => {}));
    
    render(<OrganizationProfilePage />);
    
    expect(screen.getByText('Loading organization profile...')).toBeInTheDocument();
  });



  test('shows error message when API request fails', async () => {
    
    (fetchWithAuth as jest.Mock).mockImplementation(() => {
      return Promise.resolve({
        ok: false,
        status: 404
      });
    });
    
    render(<OrganizationProfilePage />);
    
   
    await waitFor(() => {
      expect(screen.getByText('An error occurred')).toBeInTheDocument();
    });
  });

  test('handles follow/unfollow functionality', async () => {
  
    (fetchWithAuth as jest.Mock).mockImplementation((url) => {
      if (url.includes('/users/profile/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ 
            role: 'user', 
            organization_id: 'different-org'
          })
        });
      } else if (url.includes('/organisation/test-org-id/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockOrganization)
        });
      } else if (url.includes('/datasets/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockDatasets)
        });
      } else if (url.includes('/follow/')) {
        return Promise.resolve({
          ok: true
        });
      }
      return Promise.reject(new Error('Unhandled URL in test'));
    });
    
    render(<OrganizationProfilePage />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Follow')).toBeInTheDocument();
    });
    
    // Click follow button
    const followButton = screen.getByText('Follow');
    act(() => {
      userEvent.click(followButton);
    });
    
    // Check if fetch was called with correct URL
    await waitFor(() => {
      expect(fetchWithAuth).toHaveBeenCalledWith(
        `${BACKEND_URL}/organisation/follow/test-org-id/`,
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  test('shows edit UI for admin users', async () => {

    (fetchWithAuth as jest.Mock).mockImplementation((url) => {
      if (url.includes('/users/profile/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ 
            role: 'organization_admin', 
            organization_id: 'test-org-id'
          })
        });
      } else if (url.includes('/organisation/test-org-id/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockOrganization)
        });
      } else if (url.includes('/datasets/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockDatasets)
        });
      }
      return Promise.reject(new Error('Unhandled URL in test'));
    });
    
    render(<OrganizationProfilePage />);
    
    // Wait for data to load and edit button to appear
    await waitFor(() => {
      expect(screen.getByText('Edit Profile')).toBeInTheDocument();
    });
    
    // Click edit button
    const editButton = screen.getByText('Edit Profile');
    act(() => {
      userEvent.click(editButton);
    });
    
    // Check if edit UI is displayed
    await waitFor(() => {
      expect(screen.getByLabelText('Organization Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Location')).toBeInTheDocument();
      expect(screen.getByLabelText('Website')).toBeInTheDocument();
      expect(screen.getByText('Save')).toBeInTheDocument();
    });
  });

  test('handles organization update functionality', async () => {

    (fetchWithAuth as jest.Mock).mockImplementation((url) => {
      if (url.includes('/users/profile/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ 
            role: 'organization_admin', 
            organization_id: 'test-org-id'
          })
        });
      } else if (url.includes('/organisation/test-org-id/') && !url.includes('PUT')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockOrganization)
        });
      } else if (url.includes('/datasets/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockDatasets)
        });
      } else if (url.includes('/organisation/test-org-id/') && url.method === 'PUT') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            ...mockOrganization,
            name: 'Updated Organization Name'
          })
        });
      }
      return Promise.reject(new Error('Unhandled URL in test'));
    });
    
    render(<OrganizationProfilePage />);
    
    // Wait for data to load and edit button to appear
    await waitFor(() => {
      expect(screen.getByText('Edit Profile')).toBeInTheDocument();
    });
    
    // Click edit button
    const editButton = screen.getByText('Edit Profile');
    act(() => {
      userEvent.click(editButton);
    });
    
    // Change organization name
    await waitFor(() => {
      const nameInput = screen.getByLabelText('Organization Name');
      fireEvent.change(nameInput, { target: { value: 'Updated Organization Name' } });
    });
    
    // Click save button
    const saveButton = screen.getByText('Save');
    act(() => {
      userEvent.click(saveButton);
    });
    
    // Check if fetch was called with FormData
    await waitFor(() => {
      expect(fetchWithAuth).toHaveBeenCalledWith(
        `${BACKEND_URL}/organisation/test-org-id/`,
        expect.objectContaining({ method: 'PUT' })
      );
    });
  });

  test('handles social links correctly', async () => {
  
    (fetchWithAuth as jest.Mock).mockImplementation((url) => {
      if (url.includes('/users/profile/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ 
            role: 'organization_admin', 
            organization_id: 'test-org-id'
          })
        });
      } else if (url.includes('/organisation/test-org-id/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockOrganization)
        });
      } else if (url.includes('/datasets/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockDatasets)
        });
      }
      return Promise.reject(new Error('Unhandled URL in test'));
    });
    
    render(<OrganizationProfilePage />);
    
    // Wait for data to load and edit button to appear
    await waitFor(() => {
      expect(screen.getByText('Edit Profile')).toBeInTheDocument();
    });
    
    // Click edit button
    const editButton = screen.getByText('Edit Profile');
    act(() => {
      userEvent.click(editButton);
    });
    
    // Check if social links are displayed
    await waitFor(() => {
      expect(screen.getByText('https://linkedin.com/company/testorg')).toBeInTheDocument();
      expect(screen.getByText('https://twitter.com/testorg')).toBeInTheDocument();
    });
    
    // Add a new social link
    const platformSelect = screen.getByRole('combobox');
    const urlInput = screen.getByPlaceholderText('https://linkedin.com/company/example');
    const addButton = screen.getByText('Add');

    act(() => {
      fireEvent.change(platformSelect, { target: { value: 'facebook' } });
      fireEvent.change(urlInput, { target: { value: 'https://facebook.com/testorg' } });
      userEvent.click(addButton);
    });
    
    // Check if new social link is added
    await waitFor(() => {
      expect(screen.getByText('https://facebook.com/testorg')).toBeInTheDocument();
    });
  });

 
  test('handles file uploads for profile and cover images', async () => {
    
    (fetchWithAuth as jest.Mock).mockImplementation((url) => {
      if (url.includes('/users/profile/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ 
            role: 'organization_admin', 
            organization_id: 'test-org-id'
          })
        });
      } else if (url.includes('/organisation/test-org-id/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockOrganization)
        });
      } else if (url.includes('/datasets/')) {
        return Promise.resolve({
          ok: true,

          json: () => Promise.resolve(mockDatasets)
        });
      }
      return Promise.reject(new Error('Unhandled URL in test'));
    });
    
    render(<OrganizationProfilePage />);
    
    // Wait for data to load and edit button to appear
    await waitFor(() => {
      expect(screen.getByText('Edit Profile')).toBeInTheDocument();
    });
    
    // Click edit button
    const editButton = screen.getByText('Edit Profile');
    act(() => {
      userEvent.click(editButton);
    });
    
    // Mock FileReader
    const mockFileReader = {
      readAsDataURL: jest.fn(),
      onload: null as unknown as ((event: ProgressEvent<FileReader>) => void) | null,
      result: 'data:image/jpeg;base64,test123'
    };
    global.FileReader = jest.fn(() => mockFileReader) as unknown as typeof FileReader;
    Object.assign(global.FileReader, {
      EMPTY: 0,
      LOADING: 1,
      DONE: 2,
    });
    
    // Simulate file upload for profile image
    const file = new File(['dummy content'], 'profile.png', { type: 'image/png' });
    const profileInput = document.getElementById('profile-upload');
    
    Object.defineProperty(profileInput, 'files', {
      value: [file]
    });
    
    fireEvent.change(profileInput);
    
    // Trigger onload
    act(() => {
      if (mockFileReader.onload) {
        if (mockFileReader.onload) {
          mockFileReader.onload({ target: mockFileReader } as unknown as ProgressEvent<FileReader>);
        }
      }
    });
    
 
    await waitFor(() => {
      expect(mockFileReader.readAsDataURL).toHaveBeenCalled();
    });
  });
});