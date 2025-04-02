import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import Sidebar from '@/components/Sidebar';
import { fetchUserData } from '@/libs/auth';
import NavItems from '@/components/NavItems';

// Mock the dependencies
jest.mock('@/libs/auth', () => ({
  fetchUserData: jest.fn(),
}));

jest.mock('@/components/NavItems', () => {
  return jest.fn(() => <div data-testid="nav-items">NavItems Component</div>);
});

describe('Sidebar Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders loading state initially', () => {
    render(<Sidebar isOpen={true} toggleSidebar={jest.fn()} />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.getByText('ALACRITY')).toBeInTheDocument();
  });

  test('renders closed sidebar correctly', () => {
    render(<Sidebar isOpen={false} toggleSidebar={jest.fn()} />);
    
    const sidebar = screen.getByRole('complementary');
    expect(sidebar).toHaveClass('-translate-x-full');
    expect(sidebar).not.toHaveClass('translate-x-0');
  });

  test('renders open sidebar correctly', () => {
    render(<Sidebar isOpen={true} toggleSidebar={jest.fn()} />);
    
    const sidebar = screen.getByRole('complementary');
    expect(sidebar).toHaveClass('translate-x-0');
    expect(sidebar).not.toHaveClass('-translate-x-full');
  });

  test('calls toggleSidebar when button is clicked', async () => {
    const toggleSidebar = jest.fn();
    render(<Sidebar isOpen={true} toggleSidebar={toggleSidebar} />);
    
    const button = screen.getByRole('button');
    await userEvent.click(button);
    
    expect(toggleSidebar).toHaveBeenCalledTimes(1);
  });

 

  test('handles unsupported role correctly', async () => {
    (fetchUserData as jest.Mock).mockResolvedValue({ role: 'unsupported_role' });
    
    render(<Sidebar isOpen={true} toggleSidebar={jest.fn()} />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
    
    // Should not render NavItems for unsupported role
    expect(NavItems).not.toHaveBeenCalled();
    expect(screen.queryByTestId('nav-items')).not.toBeInTheDocument();
  });

  test('handles fetch error correctly', async () => {
    (fetchUserData as jest.Mock).mockRejectedValue(new Error('Fetch error'));
    
    render(<Sidebar isOpen={true} toggleSidebar={jest.fn()} />);
    
    // Mock console.error to prevent it from appearing in test output
    const originalConsoleError = console.error;
    console.error = jest.fn();
    
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
    
    // Should not render NavItems on error
    expect(NavItems).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalled();
    
    // Restore console.error
    console.error = originalConsoleError;
  });

  test('handles null user data correctly', async () => {
    (fetchUserData as jest.Mock).mockResolvedValue(null);
    
    render(<Sidebar isOpen={true} toggleSidebar={jest.fn()} />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
    
    // Should not render NavItems for null user data
    expect(NavItems).not.toHaveBeenCalled();
    expect(screen.queryByTestId('nav-items')).not.toBeInTheDocument();
  });
});