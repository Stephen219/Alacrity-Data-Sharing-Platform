import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Sidebar from '@/components/Sidebar';

jest.mock('@/components/NavItems', () => {
  return function MockNavItems({ userRole }: { userRole: string }) {
    return <div data-testid="nav-items">Mock NavItems: {userRole}</div>;
  };
});

describe('Sidebar', () => {
  const defaultProps = {
    isOpen: true,
    toggleSidebar: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the ALACRITY title', () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByText('ALACRITY')).toBeInTheDocument();
  });

  it('applies correct classes when sidebar is open', () => {
    const { container } = render(<Sidebar {...defaultProps} />);
    const aside = container.querySelector('aside');
    expect(aside).toHaveClass('translate-x-0');
    expect(aside).not.toHaveClass('-translate-x-full');
  });

  it('applies correct classes when sidebar is closed', () => {
    const { container } = render(<Sidebar {...defaultProps} isOpen={false} />);
    const aside = container.querySelector('aside');
    expect(aside).toHaveClass('-translate-x-full');
    expect(aside).not.toHaveClass('translate-x-0');
  });

});