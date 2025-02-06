import React from 'react';
import { render, screen } from '@testing-library/react';
import NavItems from '../components/NavItems';
import { NAV_ITEMS } from '@/components/config';

jest.mock('@/hooks/use-on-click-outside', () => ({
  useOnClickOutside: jest.fn()
}));

jest.mock('../components/NavItem', () => {
  return function MockNavItem(props: any) {
    return <div data-testid={`nav-item-${props.tools.value}`}>{props.tools.label}</div>;
  };
});

describe('NavItems Component', () => {
  const mockNavItems = [
    {
      label: 'Tools 1',
      value: 'tools1',
      roles: ['researcher'],
      featured: []
    },
    {
      label: 'Tools 2',
      value: 'tools2',
      roles: ['organisation'],
      featured: []
    }
  ];

  beforeEach(() => {
    jest.spyOn(NAV_ITEMS, 'filter').mockImplementation((predicate) => 
      mockNavItems.filter(predicate)
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('renders only items matching user role', () => {
    render(<NavItems userRole="researcher" />);
    
    const tools1 = screen.getByTestId('nav-item-tools1');
    expect(tools1).toBeInTheDocument();
    
    const tools2 = screen.queryByTestId('nav-item-tools2');
    expect(tools2).not.toBeInTheDocument();
  });

  test('renders no items for null user role', () => {
    render(<NavItems userRole={null} />);
    
    const navItems = screen.queryAllByTestId(/nav-item-/);
    expect(navItems).toHaveLength(0);
  });
});