import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import UserChatListPage from '@/components/chat/chats-user'; // Adjust path as needed
import { fetchWithAuth } from '@/libs/auth';
import { useRouter } from 'next/navigation';

jest.mock('@/libs/auth');
jest.mock('next/navigation');
jest.mock('@/config', () => ({
  BACKEND_URL: 'http://localhost:8000',
}));

describe('UserChatListPage', () => {
  const mockChats: ChatSummary[] = [
    {
      conversation_id: '1',
      participant: { id: 2, first_name: 'John', last_name: 'Doe', profile_picture: null },
      last_message: 'Hello',
      last_timestamp: '2023-01-01T12:00:00Z',
      unread_count: 1,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (fetchWithAuth as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockChats),
    });
    localStorage.setItem('access_token', 'mock-token');
    global.WebSocket = jest.fn(() => ({
      onopen: () => {},
      onmessage: () => {},
      onerror: () => {},
      onclose: () => {},
      send: jest.fn(),
      close: jest.fn(),
      readyState: WebSocket.OPEN,
    }));
  });

  afterEach(() => {
    localStorage.clear();
  });


  it('fetches and displays chats', async () => {
    render(<UserChatListPage />);
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Hello')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument(); // unread count
    });
  });

  it('filters chats based on search query', async () => {
    render(<UserChatListPage />);
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search chats...');
    fireEvent.change(searchInput, { target: { value: 'Jane' } });
    await waitFor(() => {
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    });

    fireEvent.change(searchInput, { target: { value: 'John' } });
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  
  it('navigates to chat on clicking a chat item', async () => {
    const pushMock = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push: pushMock });
    render(<UserChatListPage />);
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('John Doe'));
    expect(pushMock).toHaveBeenCalledWith('/chat/users/message/1');
  });

  it('displays no chats message when chats are empty', async () => {
    (fetchWithAuth as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    });
    render(<UserChatListPage />);
    await waitFor(() => {
      expect(screen.getByText('No chats yet. Start a new one!')).toBeInTheDocument();
    });
  });

});