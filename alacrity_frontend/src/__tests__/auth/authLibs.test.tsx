
import { jest, describe, beforeEach, it, expect } from '@jest/globals';
import { login, logout, refreshToken, fetchWithAuth } from '@/libs/auth';

// Mock next/navigation properly
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush
  })
}));

// Extend Window interface for tests
declare global {
  interface Window {
    localStorage: Storage;
  }
}

describe('Authentication Utilities', () => {
  // Setup mocks with proper typing
  const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
  global.fetch = mockFetch as unknown as typeof fetch;
  
  interface MockLocalStorage {
    store: { [key: string]: string };
    getItem: jest.Mock;
    setItem: jest.Mock;
    removeItem: jest.Mock;
    clear: jest.Mock;
  }

  let localStorageMock: MockLocalStorage;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Setup localStorage mock with proper typing
    localStorageMock = {
      store: {},
      getItem: jest.fn((key: string) => localStorageMock.store[key] || null),
      setItem: jest.fn((key: string, value: string) => {
        localStorageMock.store[key] = value;
      }),
      removeItem: jest.fn((key: string) => {
        delete localStorageMock.store[key];
      }),
      clear: jest.fn(() => {
        localStorageMock.store = {};
      })
    };
    
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock
    });
    
    // Reset localStorage before each test
    localStorage.clear();
    
    // Mock window.location
    const windowLocation = { href: '' };
    delete (window as unknown).location;
    (window as unknown).location = windowLocation;
  });

  describe('login', () => {
    it('should successfully log in user', async () => {
      const mockUserData = {
        access_token: 'mock_access_token',
        refresh_token: 'mock_refresh_token',
        user: { id: 1, email: 'test@example.com' }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        redirected: false,
        type: 'basic',
        url: '',
        clone: jest.fn(),
        body: null,
        bodyUsed: false,
        arrayBuffer: jest.fn(),
        blob: jest.fn(),
        formData: jest.fn(),
        json: () => Promise.resolve(mockUserData),
        text: jest.fn()
      });

      const result = await login('test@example.com', 'password123');

      expect(result.success).toBe(true);
      expect(result.user).toEqual(mockUserData.user);
      expect(localStorage.setItem).toHaveBeenCalledWith('access_token', mockUserData.access_token);
      expect(localStorage.setItem).toHaveBeenCalledWith('refresh_token', mockUserData.refresh_token);
      expect(localStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockUserData.user));
    });

    it('should handle login failure', async () => {
      mockFetch.mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve({ error: 'Invalid credentials' }),
          headers: undefined,
          redirected: false,
          status: 0,
          statusText: '',
          type: 'basic',
          url: '',
          clone: function (): Response {
              throw new Error('Function not implemented.');
          },
          body: null,
          bodyUsed: false,
          arrayBuffer: function (): Promise<ArrayBuffer> {
              throw new Error('Function not implemented.');
          },
          blob: function (): Promise<Blob> {
              throw new Error('Function not implemented.');
          },
          bytes: function (): Promise<Uint8Array> {
              throw new Error('Function not implemented.');
          },
          formData: function (): Promise<FormData> {
              throw new Error('Function not implemented.');
          },
          text: function (): Promise<string> {
              throw new Error('Function not implemented.');
          }
      });

      const result = await login('test@example.com', 'wrong_password');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid credentials');
      expect(localStorage.setItem).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should clear localStorage and redirect to sign-in page', () => {
      logout();

      expect(localStorage.removeItem).toHaveBeenCalledWith('access_token');
      expect(localStorage.removeItem).toHaveBeenCalledWith('refresh_token');
      expect(localStorage.removeItem).toHaveBeenCalledWith('user');
      expect(window.location.href).toBe('/auth/sign-in');
    });
  });

  describe('refreshToken', () => {
    it('should successfully refresh token', async () => {
      localStorage.setItem('refresh_token', 'old_refresh_token');
      
      mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ access: 'new_access_token' }),
          headers: undefined,
          redirected: false,
          status: 0,
          statusText: '',
          type: 'basic',
          url: '',
          clone: function (): Response {
              throw new Error('Function not implemented.');
          },
          body: null,
          bodyUsed: false,
          arrayBuffer: function (): Promise<ArrayBuffer> {
              throw new Error('Function not implemented.');
          },
          blob: function (): Promise<Blob> {
              throw new Error('Function not implemented.');
          },
          bytes: function (): Promise<Uint8Array> {
              throw new Error('Function not implemented.');
          },
          formData: function (): Promise<FormData> {
              throw new Error('Function not implemented.');
          },
          text: function (): Promise<string> {
              throw new Error('Function not implemented.');
          }
      });

      const result = await refreshToken();

      expect(result).toBe('new_access_token');
      expect(localStorage.setItem).toHaveBeenCalledWith('access_token', 'new_access_token');
    });

    it('should return null and logout if refresh fails', async () => {
      localStorage.setItem('refresh_token', 'invalid_refresh_token');
      
      mockFetch.mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve({ error: 'Invalid refresh token' }),
          headers: undefined,
          redirected: false,
          status: 0,
          statusText: '',
          type: 'basic',
          url: '',
          clone: function (): Response {
              throw new Error('Function not implemented.');
          },
          body: null,
          bodyUsed: false,
          arrayBuffer: function (): Promise<ArrayBuffer> {
              throw new Error('Function not implemented.');
          },
          blob: function (): Promise<Blob> {
              throw new Error('Function not implemented.');
          },
          bytes: function (): Promise<Uint8Array> {
              throw new Error('Function not implemented.');
          },
          formData: function (): Promise<FormData> {
              throw new Error('Function not implemented.');
          },
          text: function (): Promise<string> {
              throw new Error('Function not implemented.');
          }
      });

      const result = await refreshToken();

      expect(result).toBeNull();
      expect(localStorage.removeItem).toHaveBeenCalledWith('access_token');
      expect(localStorage.removeItem).toHaveBeenCalledWith('refresh_token');
      expect(localStorage.removeItem).toHaveBeenCalledWith('user');
    });
  });

  describe('fetchWithAuth', () => {
    it('should make authenticated request with valid token', async () => {
      localStorage.setItem('access_token', 'valid_token');
      
      mockFetch.mockResolvedValueOnce({
          status: 200,
          ok: true,
          json: () => Promise.resolve({ data: 'success' }),
          headers: undefined,
          redirected: false,
          statusText: '',
          type: 'basic',
          url: '',
          clone: function (): Response {
              throw new Error('Function not implemented.');
          },
          body: null,
          bodyUsed: false,
          arrayBuffer: function (): Promise<ArrayBuffer> {
              throw new Error('Function not implemented.');
          },
          blob: function (): Promise<Blob> {
              throw new Error('Function not implemented.');
          },
          bytes: function (): Promise<Uint8Array> {
              throw new Error('Function not implemented.');
          },
          formData: function (): Promise<FormData> {
              throw new Error('Function not implemented.');
          },
          text: function (): Promise<string> {
              throw new Error('Function not implemented.');
          }
      });

      const response = await fetchWithAuth('https://api.example.com/data');

      expect(response.ok).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/data',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer valid_token'
          })
        })
      );
    });

    it('should attempt token refresh on 401 response', async () => {
      localStorage.setItem('access_token', 'expired_token');
      localStorage.setItem('refresh_token', 'valid_refresh_token');
      
      // First call returns 401
      mockFetch.mockResolvedValueOnce({
          status: 401,
          ok: false,
          headers: undefined,
          redirected: false,
          statusText: '',
          type: 'basic',
          url: '',
          clone: function (): Response {
              throw new Error('Function not implemented.');
          },
          body: null,
          bodyUsed: false,
          arrayBuffer: function (): Promise<ArrayBuffer> {
              throw new Error('Function not implemented.');
          },
          blob: function (): Promise<Blob> {
              throw new Error('Function not implemented.');
          },
          bytes: function (): Promise<Uint8Array> {
              throw new Error('Function not implemented.');
          },
          formData: function (): Promise<FormData> {
              throw new Error('Function not implemented.');
          },
          json: function (): Promise<unknown> {
              throw new Error('Function not implemented.');
          },
          text: function (): Promise<string> {
              throw new Error('Function not implemented.');
          }
      });
      
      // Token refresh call
      mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ access: 'new_access_token' }),
          headers: undefined,
          redirected: false,
          status: 0,
          statusText: '',
          type: 'basic',
          url: '',
          clone: function (): Response {
              throw new Error('Function not implemented.');
          },
          body: null,
          bodyUsed: false,
          arrayBuffer: function (): Promise<ArrayBuffer> {
              throw new Error('Function not implemented.');
          },
          blob: function (): Promise<Blob> {
              throw new Error('Function not implemented.');
          },
          bytes: function (): Promise<Uint8Array> {
              throw new Error('Function not implemented.');
          },
          formData: function (): Promise<FormData> {
              throw new Error('Function not implemented.');
          },
          text: function (): Promise<string> {
              throw new Error('Function not implemented.');
          }
      });
      
      // Retry with new token
      mockFetch.mockResolvedValueOnce({
          status: 200,
          ok: true,
          headers: undefined,
          redirected: false,
          statusText: '',
          type: 'basic',
          url: '',
          clone: function (): Response {
              throw new Error('Function not implemented.');
          },
          body: null,
          bodyUsed: false,
          arrayBuffer: function (): Promise<ArrayBuffer> {
              throw new Error('Function not implemented.');
          },
          blob: function (): Promise<Blob> {
              throw new Error('Function not implemented.');
          },
          bytes: function (): Promise<Uint8Array> {
              throw new Error('Function not implemented.');
          },
          formData: function (): Promise<FormData> {
              throw new Error('Function not implemented.');
          },
          json: function (): Promise<unknown> {
              throw new Error('Function not implemented.');
          },
          text: function (): Promise<string> {
              throw new Error('Function not implemented.');
          }
      });

      const response = await fetchWithAuth('https://api.example.com/data');

      expect(response.ok).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(localStorage.setItem).toHaveBeenCalledWith('access_token', 'new_access_token');
    });
  });



});