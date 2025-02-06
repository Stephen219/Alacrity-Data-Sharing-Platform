import React from 'react';
import { render, screen } from '@testing-library/react';
import Navbar from '@/components/Navbar';

jest.mock('lucide-react', () => ({
  Bell: () => null
}));

jest.mock('@/components/MaxWidthWrapper', () => {
  return function MockMaxWidthWrapper({ children }: { children: React.ReactNode }) {
    return <div>{children}</div>;
  };
});

jest.mock('@/components/NavItems', () => {
  return function MockNavItems() {
    return <div>Navigation Items</div>;
  };
});

jest.mock('@/components/ui/button', () => ({
  buttonVariants: () => 'mock-button-class'
}));

describe('Navbar Component', () => {
  test('renders logo', () => {
    render(<Navbar />);
    expect(screen.getByText('ALACRITY')).toBeInTheDocument();
  });

  test('renders account link', () => {
    render(<Navbar />);
    expect(screen.getByText('My Account')).toBeInTheDocument();
  });
});