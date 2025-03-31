import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ChatPage from '@/components/chat/chattinguser';
import { fetchWithAuth } from '@/libs/auth';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import { BACKEND_URL } from '@/config';

jest.mock('@/libs/auth');
jest.mock('next/navigation');
jest.mock('jwt-decode');

interface MockedElement extends Element {
  scrollIntoView?: jest.Mock;
}

describe('ChatPage', () => {
  const mockParams = { id: '1' };
  const mockConversation = {
    participant1: { id: 1, first_name: 'Alice', last_name: 'Smith', profile_picture: null },
    participant2: { id: 2, first_name: 'Bob', last_name: 'Jones', profile_picture: null },
  };
  const mockMessages = [
    {
      message_id: '1',
      sender_id: 2,
      content: 'Hi there',
      timestamp: '2023-01-01T12:00:00Z',
      sender_first_name: 'Bob',
      sender_last_name: 'Jones',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: jest.fn() });
    (fetchWithAuth as jest.Mock).mockImplementation((url) => {
      if (url === `${BACKEND_URL}/users/api/conversations/1/`) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockConversation),
        });
      }
      if (url === `${BACKEND_URL}/users/api/conversations/1/messages/`) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockMessages),
        });
      }
      return Promise.resolve({ ok: false });
    });
    (jwtDecode as jest.Mock).mockReturnValue({ user_id: 1 });
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
    Element.prototype.scrollIntoView = jest.fn();
  });

  afterEach(() => {
    localStorage.clear();
    delete (Element.prototype as MockedElement).scrollIntoView;
  });

  it('fetches and displays conversation data', async () => {
    render(<ChatPage params={mockParams} />);
    await waitFor(() => {
      expect(screen.getByText('Bob Jones')).toBeInTheDocument();
      expect(screen.getByText('Hi there')).toBeInTheDocument();
    });
  });

  it('navigates back to chat list', async () => {
    const pushMock = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push: pushMock });
    render(<ChatPage params={mockParams} />);
    await waitFor(() => {
      expect(screen.getByText('Bob Jones')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText('Go back'));
    expect(pushMock).toHaveBeenCalledWith('/chat/users/chats');
  });

  it('handles invalid conversation ID', async () => {
    const pushMock = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push: pushMock });
    render(<ChatPage params={{ id: 'undefined' }} />);
    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/chat/users/chats');
    });
  });
});