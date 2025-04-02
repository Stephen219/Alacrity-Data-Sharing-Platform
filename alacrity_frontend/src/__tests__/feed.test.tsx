// import { render, screen, fireEvent, waitFor } from '@testing-library/react';
// import SearchPage from '@/components/feed';
// import { fetchUserData } from '@/libs/auth';
// import { useRouter } from 'next/navigation';
// import * as debounce from 'lodash/debounce';

// jest.mock('@/libs/auth', () => ({
//   fetchUserData: jest.fn(),
// }));

// jest.mock('next/navigation', () => ({
//   useRouter: jest.fn(),
// }));

// jest.mock('lodash/debounce', () => jest.fn((fn) => fn));

// jest.mock('@/components/ui/button', () => ({
//   buttonVariants: jest.fn(() => 'mock-button-class'),
// }));

// jest.mock('lucide-react', () => ({
//   Search: () => <svg data-testid="search-icon" />,
//   TrendingUp: () => <svg data-testid="trending-up-icon" />,
// }));

// global.fetch = jest.fn();

// describe('SearchPage', () => {
//   const mockRouterPush = jest.fn();
//   const mockTrendingDatasets = [
//     { dataset_id: '1', title: 'Dataset 1', category: 'Science', description: 'Desc 1', organization_name: 'Org 1', contributor_id: 'c1', link: 'link1' },
//   ];
//   const mockTrendingResearchers = [
//     { id: 'r1', first_name: 'John', sur_name: 'Doe', username: 'johndoe', profile_picture: '', field: 'Science', followers_count: 100 },
//   ];
//   const mockTrendingOrganizations = [
//     { Organization_id: 'o1', name: 'Org 1', email: 'org1@example.com', profile_picture: '', field: 'Science', followers_count: 50 },
//   ];
//   const mockRandomDatasets = [
//     { dataset_id: '2', title: 'Dataset 2', category: 'Tech', description: 'Desc 2', organization_name: 'Org 2', contributor_id: 'c2', link: 'link2' },
//   ];
//   const mockFollowedReports = [
//     {
//       research_submission: { id: 'r1', title: 'Report 1', description: 'Report Desc 1', raw_results: '', summary: '', status: 'published', researcher_email: 'researcher@example.com', submitted_at: '2023-01-01' },
//       visibility: 'public', tags: ['science'], likes_count: 10, bookmarks_count: 5, is_private: false,
//     },
//   ];
//   const mockRandomReports = [
//     {
//       research_submission: { id: 'r2', title: 'Report 2', description: 'Report Desc 2', raw_results: '', summary: '', status: 'published', researcher_email: 'researcher2@example.com', submitted_at: '2023-01-02' },
//       visibility: 'public', tags: ['tech'], likes_count: 8, bookmarks_count: 3, is_private: false,
//     },
//   ];

//   beforeEach(() => {
//     jest.clearAllMocks();
//     (useRouter as jest.Mock).mockReturnValue({ push: mockRouterPush });
//     (global.fetch as jest.Mock).mockImplementation((url) => {
//       if (url.includes('/datasets/trending/datasets/')) {
//         return Promise.resolve({ ok: true, json: () => Promise.resolve(mockTrendingDatasets) });
//       }
//       if (url.includes('/users/trending/')) {
//         return Promise.resolve({ ok: true, json: () => Promise.resolve(mockTrendingResearchers) });
//       }
//       if (url.includes('/organisation/trending/organizations/')) {
//         return Promise.resolve({ ok: true, json: () => Promise.resolve(mockTrendingOrganizations) });
//       }
//       if (url.includes('/datasets/random/datasets/')) {
//         return Promise.resolve({ ok: true, json: () => Promise.resolve(mockRandomDatasets) });
//       }
//       if (url.includes('/datasets/get_datasets/all')) {
//         return Promise.resolve({ ok: true, json: () => Promise.resolve(mockRandomDatasets) });
//       }
//       if (url.includes('/research/followed-reports/')) {
//         return Promise.resolve({ ok: true, json: () => Promise.resolve(mockFollowedReports) });
//       }
//       if (url.includes('/research/random-reports/')) {
//         return Promise.resolve({ ok: true, json: () => Promise.resolve(mockRandomReports) });
//       }
//       if (url.includes('/users/search/')) {
//         return Promise.resolve({
//           ok: true,
//           json: () => Promise.resolve({
//             datasets: mockRandomDatasets,
//             users: mockTrendingResearchers,
//             organizations: mockTrendingOrganizations,
//             reports: mockFollowedReports,
//           }),
//         });
//       }
//       return Promise.resolve({ ok: false, json: () => Promise.resolve([]) });
//     });
//     localStorage.clear();
//   });

//   // Test 1: Renders unauthenticated state
//   it('renders correctly when unauthenticated', async () => {
//     (fetchUserData as jest.Mock).mockResolvedValue(null);
//     render(<SearchPage />);
//     await waitFor(() => {
//       expect(screen.getByText('Join Us')).toBeInTheDocument();
//       expect(screen.getByText('Sign in to follow researchers and see their reports!')).toBeInTheDocument();
//       expect(screen.getByText('Sign In')).toBeInTheDocument();
//       expect(screen.getByText('Random Datasets')).toBeInTheDocument();
//       expect(screen.getByText('Sign in to see reports from researchers you follow or random reports.')).toBeInTheDocument();
//       expect(screen.getByText('Top Researchers')).toBeInTheDocument();
//       expect(screen.getByText('John Doe')).toBeInTheDocument();
//       expect(screen.getByText('Top Organizations')).toBeInTheDocument();
//       expect(screen.getByText('Org 1')).toBeInTheDocument();
//     });
//   });

//   // Test 2: Renders trending content
//   it('renders trending content when switching to Trending tab', async () => {
//     (fetchUserData as jest.Mock).mockResolvedValue(null);
//     render(<SearchPage />);
//     await waitFor(() => {
//       fireEvent.click(screen.getByText('Trending'));
//       expect(screen.getByText('Trending Datasets')).toBeInTheDocument();
//       expect(screen.getByText('Dataset 1')).toBeInTheDocument();
//       expect(screen.getByText('Trending Researchers')).toBeInTheDocument();
//       expect(screen.getByText('John Doe')).toBeInTheDocument();
//       expect(screen.getByText('Trending Organizations')).toBeInTheDocument();
//       expect(screen.getByText('Org 1')).toBeInTheDocument();
//     });
//   });

//   // Test 3: Renders authenticated researcher content
//   it('renders followed content for researcher role', async () => {
//     localStorage.setItem('access_token', 'mock-token');
//     (fetchUserData as jest.Mock).mockResolvedValue({ role: 'researcher', field: 'Science' });
//     render(<SearchPage />);
//     await waitFor(() => {
//       expect(screen.getByText('Related Datasets')).toBeInTheDocument();
//       expect(screen.getByText('Dataset 2')).toBeInTheDocument();
//       expect(screen.getByText('Reports from Followed Researchers')).toBeInTheDocument();
//       expect(screen.getByText('Report 1')).toBeInTheDocument();
//       expect(screen.getByText('Who to Follow (Researchers)')).toBeInTheDocument();
//       expect(screen.getByText('Who to Follow (Organizations)')).toBeInTheDocument();
//     });
//   });

//   // Test 4: Renders authenticated non-researcher content
//   it('renders random content for non-researcher role', async () => {
//     localStorage.setItem('access_token', 'mock-token');
//     (fetchUserData as jest.Mock).mockResolvedValue({ role: 'organization_admin', field: 'Tech' });
//     render(<SearchPage />);
//     await waitFor(() => {
//       expect(screen.getByText('Random Datasets')).toBeInTheDocument();
//       expect(screen.getByText('Dataset 2')).toBeInTheDocument();
//       expect(screen.getByText('Random Reports')).toBeInTheDocument();
//       expect(screen.getByText('Report 2')).toBeInTheDocument();
//       expect(screen.getByText('Who to Follow (Researchers)')).toBeInTheDocument();
//       expect(screen.getByText('Who to Follow (Organizations)')).toBeInTheDocument();
//     });
//   });

//   // Test 5: Handles unauthenticated dataset click
//   it('shows alert and navigates to sign-in when clicking dataset while unauthenticated', async () => {
//     (fetchUserData as jest.Mock).mockResolvedValue(null);
//     window.alert = jest.fn();
//     render(<SearchPage />);
//     await waitFor(() => {
//       fireEvent.click(screen.getByText('Dataset 2'));
//       expect(window.alert).toHaveBeenCalledWith('Please sign in to view the dataset.');
//       expect(mockRouterPush).toHaveBeenCalledWith('/auth/sign-in');
//     });
//   });

//   // Test 6: Handles authenticated dataset click
//   it('navigates to dataset description when authenticated', async () => {
//     localStorage.setItem('access_token', 'mock-token');
//     (fetchUserData as jest.Mock).mockResolvedValue({ role: 'researcher', field: 'Science' });
//     render(<SearchPage />);
//     await waitFor(() => {
//       expect(screen.getByText('Dataset 2')).toBeInTheDocument(); // Ensure dataset is rendered
//       fireEvent.click(screen.getByText('Dataset 2'));
//       expect(mockRouterPush).toHaveBeenCalledWith('/datasets/description?id=2');
//     });
//   });

//   // Test 7: Handles authenticated report click
//   it('navigates to report view when authenticated', async () => {
//     localStorage.setItem('access_token', 'mock-token');
//     (fetchUserData as jest.Mock).mockResolvedValue({ role: 'researcher', field: 'Science' });
//     render(<SearchPage />);
//     await waitFor(() => {
//       expect(screen.getByText('Report 1')).toBeInTheDocument(); // Ensure report is rendered
//       fireEvent.click(screen.getByText('Report 1'));
//       expect(mockRouterPush).toHaveBeenCalledWith('/researcher/allsubmissions/view/r1');
//     });
//   });

//   // Test 8: Displays search suggestions for authenticated user
//   it('shows search suggestions when authenticated', async () => {
//     localStorage.setItem('access_token', 'mock-token');
//     (fetchUserData as jest.Mock).mockResolvedValue({ role: 'researcher', field: 'Science' });
//     render(<SearchPage />);
//     await waitFor(() => {
//       const searchInput = screen.getByPlaceholderText('Search datasets, reports, users, or more...');
//       fireEvent.change(searchInput, { target: { value: 'test' } });
//       expect(screen.getByText('Dataset 2 (Dataset)')).toBeInTheDocument();
//       expect(screen.getByText('John Doe (@johndoe)')).toBeInTheDocument();
//       expect(screen.getByText('Org 1 (Org)')).toBeInTheDocument();
//       expect(screen.getByText('Report 1 (Report)')).toBeInTheDocument();
//     });
//   });

//   // Test 9: Handles category filtering
//   it('filters datasets by category', async () => {
//     (fetchUserData as jest.Mock).mockResolvedValue(null);
//     render(<SearchPage />);
//     await waitFor(() => {
//       expect(screen.getByText('Tech')).toBeInTheDocument(); // Ensure category button is rendered
//       fireEvent.click(screen.getByText('Tech'));
//       expect(screen.getByText('Dataset 2')).toBeInTheDocument();
//       expect(screen.queryByText('Dataset 1')).not.toBeInTheDocument();
//     });
//   });

//   // Test 10: Displays error message on fetch failure
//   it('displays error message when fetch fails', async () => {
//     (fetchUserData as jest.Mock).mockResolvedValue(null);
//     (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
//     render(<SearchPage />);
//     await waitFor(() => {
//       expect(screen.getByText('Failed to load data. Please try again later.')).toBeInTheDocument();
//     });
//   });

//   // Test 11: Handles suggestion click for navigation
//   it('navigates to correct page on suggestion click', async () => {
//     localStorage.setItem('access_token', 'mock-token');
//     (fetchUserData as jest.Mock).mockResolvedValue({ role: 'researcher', field: 'Science' });
//     render(<SearchPage />);
//     await waitFor(() => {
//       const searchInput = screen.getByPlaceholderText('Search datasets, reports, users, or more...');
//       fireEvent.change(searchInput, { target: { value: 'test' } });
//       expect(screen.getByText('Dataset 2 (Dataset)')).toBeInTheDocument(); // Ensure suggestion is rendered
//       fireEvent.click(screen.getByText('Dataset 2 (Dataset)'));
//       expect(mockRouterPush).toHaveBeenCalledWith('/datasets/description?id=2');
//     });
//   });

//   // Test 12: Shows loading state
//   it('displays loading state initially', async () => {
//     (fetchUserData as jest.Mock).mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve(null), 100)));
//     render(<SearchPage />);
//     expect(screen.getByText('Loading content...')).toBeInTheDocument(); // Check immediately after render
//     await waitFor(() => {
//       expect(screen.queryByText('Loading content...')).not.toBeInTheDocument();
//     }, { timeout: 200 });
//   });
// });