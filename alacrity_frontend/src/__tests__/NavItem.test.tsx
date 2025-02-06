import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import NavItem from '@/components/NavItem'; 

jest.mock('lucide-react', () => ({
  ChevronDown: () => <div data-testid="chevron-down" />
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => <img {...props} data-testid="mock-image" />
}));

const mockTools = {
  label: 'Test Tools',
  value: 'test',
  roles: ['researcher'],
  featured: [
    {
      name: 'Featured Item 1',
      href: '/item1',
      imageSrc: '/test-image-1.jpg'
    },
    {
      name: 'Featured Item 2', 
      href: '/item2',
      imageSrc: '/test-image-2.jpg'
    }
  ]
};

describe('NavItem Component', () => {
  test('renders button with label', () => {
    render(<NavItem tools={mockTools} handleOpen={() => {}} isOpen={false} isAnyOpen={false} />);
    
    const buttonElement = screen.getByText('Test Tools');
    expect(buttonElement).toBeInTheDocument();
  });

  test('renders chevron down icon', () => {
    render(<NavItem tools={mockTools} handleOpen={() => {}} isOpen={false} isAnyOpen={false} />);
    
    const chevronIcon = screen.getByTestId('chevron-down');
    expect(chevronIcon).toBeInTheDocument();
  });

  test('calls handleOpen when button is clicked', () => {
    const mockHandleOpen = jest.fn();
    render(<NavItem tools={mockTools} handleOpen={mockHandleOpen} isOpen={false} isAnyOpen={false} />);
    
    const buttonElement = screen.getByText('Test Tools');
    fireEvent.click(buttonElement);
    
    expect(mockHandleOpen).toHaveBeenCalledTimes(1);
  });

  test('renders featured items when dropdown is open', () => {
    render(<NavItem tools={mockTools} handleOpen={() => {}} isOpen={true} isAnyOpen={false} />);
    
    const item1 = screen.getByText('Featured Item 1');
    const item2 = screen.getByText('Featured Item 2');
    
    expect(item1).toBeInTheDocument();
    expect(item2).toBeInTheDocument();
  });

  test('does not render dropdown when isOpen is false', () => {
    render(<NavItem tools={mockTools} handleOpen={() => {}} isOpen={false} isAnyOpen={false} />);
    
    const item1 = screen.queryByText('Featured Item 1');
    expect(item1).not.toBeInTheDocument();
  });
});