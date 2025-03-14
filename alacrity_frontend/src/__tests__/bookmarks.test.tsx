import { render, screen, waitFor } from '@testing-library/react'
import BookmarksPage from "@/app/datasets/bookmarks/page"
import * as auth from '@/libs/auth'

jest.mock('@/libs/auth')

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(() => {
      return {
        matches: false,
        media: '',
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }
    }),
  })
})

describe('BookmarksPage', () => {
  beforeEach(() => {
    (auth.fetchWithAuth as jest.Mock).mockClear()
  })

  it('renders loading state initially', () => {
    (auth.fetchWithAuth as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    })
    render(<BookmarksPage />)
    expect(screen.getByText('Loading bookmarks...')).toBeInTheDocument()
  })

  it('renders error message when fetching bookmarks fails', async () => {
    (auth.fetchWithAuth as jest.Mock).mockRejectedValueOnce(new Error('Failed to fetch bookmarks'))
    render(<BookmarksPage />)
    await waitFor(() => expect(screen.getByText('Error loading bookmarks. Please try again.')).toBeInTheDocument())
  })

  it('renders no bookmarks message when no bookmarks are available', async () => {
    (auth.fetchWithAuth as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    })
    render(<BookmarksPage />)
    await waitFor(() => expect(screen.getByText('No bookmarks found.')).toBeInTheDocument())
  })

  // it('renders bookmarks correctly when fetched successfully', async () => {
  //   (auth.fetchWithAuth as jest.Mock).mockResolvedValueOnce({
  //     ok: true,
  //     json: async () => [
  //       {
  //         dataset_id: '1',
  //         title: 'Smoking Dataset',
  //         description: 'A dataset related to smoking and health.',
  //         organization_name: 'Health Org',
  //         category: 'Health',
  //         created_at: '2025-03-01',
  //         tags: ['smoking', 'health'],
  //       },
  //     ],
  //   })
  //   render(<BookmarksPage />)
  //   await waitFor(() => expect(screen.getByText('Smoking Dataset')).toBeInTheDocument())
  // })

  // it('handles pagination correctly', async () => {
  //   (auth.fetchWithAuth as jest.Mock).mockResolvedValueOnce({
  //     ok: true,
  //     json: async () => Array.from({ length: 12 }, (_, i) => ({
  //       dataset_id: String(i + 1),
  //       title: `Dataset ${i + 1}`,
  //       description: `Description for dataset ${i + 1}`,
  //       organization_name: 'Org',
  //       category: 'Category',
  //       created_at: '2025-03-01',
  //       tags: ['tag'],
  //     })),
  //   })
  //   render(<BookmarksPage />)
  //   await waitFor(() => expect(screen.getByText('Dataset 1')).toBeInTheDocument())
  //   fireEvent.click(screen.getByText('2'))
  //   await waitFor(() => expect(screen.getByText('Dataset 7')).toBeInTheDocument())
  // })
})
