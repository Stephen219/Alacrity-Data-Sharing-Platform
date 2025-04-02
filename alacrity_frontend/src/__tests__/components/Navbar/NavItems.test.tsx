import React from "react";
import { render, screen } from "@testing-library/react";
import NavItems from "../../../components/Navbar/NavItems";

jest.mock("@/components/config", () => ({
  NAV_ITEMS: [
    {
      label: "Browse Datasets",
      value: "browse-datasets",
      roles: ["researcher"],
      featured: [],
    },
    {
      label: "Analysis Tools",
      value: "analysis-tools",
      roles: ["researcher"],
      featured: [],
    },
    {
      label: "View Requests",
      value: "view-pending",
      roles: ["researcher"],
      featured: [],
    },
    {
      label: "Manage Data",
      value: "manage-data",
      roles: ["organisation"],
      featured: [],
    },
  ],
}));

jest.mock("@/hooks/use-on-click-outside", () => ({
  useOnClickOutside: jest.fn(),
}));

jest.mock("@/components/Navbar/NavItem", () => {
  return function MockNavItem(props: { tools: { value: string; label: string } }) {
    return <div data-testid={`nav-item-${props.tools.value}`}>{props.tools.label}</div>;
  };
});

describe("NavItems Component", () => {
  test("renders only items matching user role", () => {
    render(<NavItems userRole="researcher" />);
    expect(screen.getByText("Browse Datasets")).toBeInTheDocument();
    expect(screen.getByText("Analysis Tools")).toBeInTheDocument();
    expect(screen.getByText("View Requests")).toBeInTheDocument();
    expect(screen.queryByText("Manage Data")).not.toBeInTheDocument();
  });

  test("renders no items for null user role", () => {
    render(<NavItems userRole={null} />);
    expect(screen.queryAllByTestId(/nav-item-/)).toHaveLength(0);
  });
});
