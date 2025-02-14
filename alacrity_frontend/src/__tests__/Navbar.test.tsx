import React from 'react';
import { render, screen } from '@testing-library/react';
import Navbar from '@/components/Navbar';

jest.mock('lucide-react', () => ({
  Bell: () => <svg data-testid="bell-icon" />,
  Menu: () => <svg data-testid="menu-icon" />
}));

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(() => '/')
}));

jest.mock('@/components/ui/button', () => ({
  buttonVariants: () => 'mock-button-class'
}));

describe('Navbar Component', () => {
  const mockToggleSidebar = jest.fn();

  test('renders logo', () => {
    render(<Navbar toggleSidebar={mockToggleSidebar} />);
    expect(screen.getByText('ALACRITY')).toBeInTheDocument();
  });

  test('renders home and about links', () => {
    render(<Navbar toggleSidebar={mockToggleSidebar} />);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('About')).toBeInTheDocument();
  });
});