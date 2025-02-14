import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { withAccessControl } from '@/components/auth_guard/AccessControl';
import { useAuth } from '@/libs/auth';
// import { useRouter } from 'next/navigation';

// Mock the hooks
jest.mock('@/libs/auth', () => ({
  useAuth: jest.fn(),
}));

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Test component
const TestComponent: React.FC = () => <div>Protected Content</div>;

describe('withAccessControl HOC', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication States', () => {
    it('should show loading state initially', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        loading: true,
      });

      const ProtectedComponent = withAccessControl(TestComponent, ['admin']);
      render(<ProtectedComponent />);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should redirect to sign-in when user is not authenticated', async () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        loading: false,
      });

      const ProtectedComponent = withAccessControl(TestComponent, ['admin']);
      render(<ProtectedComponent />);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/auth/sign-in');
      });
    });

    it('should render component for authenticated user with correct role', async () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: { role: 'admin' },
        loading: false,
      });

      const ProtectedComponent = withAccessControl(TestComponent, ['admin']);
      render(<ProtectedComponent />);

      await waitFor(() => {
        expect(screen.getByText('Protected Content')).toBeInTheDocument();
      });
    });
  });

  describe('Role-based Access', () => {
    it('should redirect to 403 page when user has incorrect role', async () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: { role: 'user' },
        loading: false,
      });

      const ProtectedComponent = withAccessControl(TestComponent, ['admin']);
      render(<ProtectedComponent />);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/errors/403');
      });
    });

    it('should allow access with multiple allowed roles', async () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: { role: 'editor' },
        loading: false,
      });

      const ProtectedComponent = withAccessControl(TestComponent, ['admin', 'editor']);
      render(<ProtectedComponent />);

      await waitFor(() => {
        expect(screen.getByText('Protected Content')).toBeInTheDocument();
      });
    });
  });

  describe('Props Handling', () => {
    it('should pass through props to wrapped component', async () => {
      const TestComponentWithProps: React.FC<{ testProp: string }> = ({ testProp }) => (
        <div>Protected Content: {testProp}</div>
      );

      (useAuth as jest.Mock).mockReturnValue({
        user: { role: 'admin' },
        loading: false,
      });

      const ProtectedComponent = withAccessControl(TestComponentWithProps, ['admin']);
      render(<ProtectedComponent testProp="test value" />);

      await waitFor(() => {
        expect(screen.getByText('Protected Content: test value')).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('should handle transition from loading to authenticated state', async () => {
      let authState = {
        user: null,
        loading: true,
      };

      (useAuth as jest.Mock).mockImplementation(() => authState);

      const ProtectedComponent = withAccessControl(TestComponent, ['admin']);
      const { rerender } = render(<ProtectedComponent />);

      expect(screen.getByText('Loading...')).toBeInTheDocument();

      // Update auth state
      authState = {
        user: { role: 'admin' },
        loading: false,
      };

      (useAuth as jest.Mock).mockImplementation(() => authState);
      rerender(<ProtectedComponent />);

      await waitFor(() => {
        expect(screen.getByText('Protected Content')).toBeInTheDocument();
      });
    });

    it('should handle transition from loading to unauthorized state', async () => {
      let authState = {
        user: null,
        loading: true,
      };

      (useAuth as jest.Mock).mockImplementation(() => authState);

      const ProtectedComponent = withAccessControl(TestComponent, ['admin']);
      const { rerender } = render(<ProtectedComponent />);

      expect(screen.getByText('Loading...')).toBeInTheDocument();

      // Update auth state to unauthorized
      authState = {
        user: { role: 'user' },
        loading: false,
      };

      (useAuth as jest.Mock).mockImplementation(() => authState);
      rerender(<ProtectedComponent />);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/errors/403');
      });
    });
  });
});