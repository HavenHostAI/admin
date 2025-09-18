import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PropertyList } from "@/components/property-management/PropertyList";

// Mock tRPC
const mockRefetch = vi.fn();
const mockMutateAsync = vi.fn();

const mockPropertiesData = {
  properties: [
    {
      id: "1",
      name: "Test Server",
      description: "A test server for development",
      type: "server" as const,
      status: "active" as const,
      configuration: {},
      owner_id: "user_123",
      is_active: true,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
    {
      id: "2",
      name: "Test Domain",
      description: "A test domain",
      type: "domain" as const,
      status: "inactive" as const,
      configuration: {},
      owner_id: "user_456",
      is_active: false,
      created_at: "2024-01-02T00:00:00Z",
      updated_at: "2024-01-02T00:00:00Z",
    },
  ],
  total: 2,
  page: 1,
  limit: 10,
};

vi.mock("~/trpc/react", () => ({
  api: {
    property: {
      list: {
        useQuery: vi.fn(() => ({
          data: mockPropertiesData,
          isLoading: false,
          error: null,
          refetch: mockRefetch,
        })),
      },
      delete: {
        useMutation: vi.fn(() => ({
          mutateAsync: mockMutateAsync,
        })),
      },
    },
  },
}));

// Mock the dialog components
vi.mock("@/components/property-management/CreatePropertyDialog", () => ({
  CreatePropertyDialog: ({ onPropertyCreated }: { onPropertyCreated: () => void }) => (
    <button onClick={onPropertyCreated}>Create Property</button>
  ),
}));

vi.mock("@/components/property-management/EditPropertyDialog", () => ({
  EditPropertyDialog: ({ property, onPropertyUpdated }: { property: any; onPropertyUpdated: () => void }) => (
    <button onClick={onPropertyUpdated}>Edit {property.name}</button>
  ),
}));

describe("PropertyList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render properties list with correct data", () => {
    render(<PropertyList />);

    expect(screen.getByText("Property Management")).toBeInTheDocument();
    expect(screen.getByText("Manage hosting properties, servers, domains, and resources")).toBeInTheDocument();
    expect(screen.getByText("Test Server")).toBeInTheDocument();
    expect(screen.getByText("Test Domain")).toBeInTheDocument();
  });

  it("should display property types and statuses correctly", () => {
    render(<PropertyList />);

    expect(screen.getByText("Server")).toBeInTheDocument();
    expect(screen.getByText("Domain")).toBeInTheDocument();
    expect(screen.getByText("active")).toBeInTheDocument();
    expect(screen.getByText("inactive")).toBeInTheDocument();
  });

  it("should show search input and filters", () => {
    render(<PropertyList />);

    expect(screen.getByPlaceholderText("Search properties...")).toBeInTheDocument();
    expect(screen.getByText("Filter by type")).toBeInTheDocument();
    expect(screen.getByText("Filter by status")).toBeInTheDocument();
  });

  it("should handle search input changes", async () => {
    const user = userEvent.setup();
    render(<PropertyList />);

    const searchInput = screen.getByPlaceholderText("Search properties...");
    await user.type(searchInput, "test search");

    expect(searchInput).toHaveValue("test search");
  });

  it("should show create property dialog", () => {
    render(<PropertyList />);

    expect(screen.getByText("Create Property")).toBeInTheDocument();
  });

  it("should show edit property dialogs for each property", () => {
    render(<PropertyList />);

    expect(screen.getByText("Edit Test Server")).toBeInTheDocument();
    expect(screen.getByText("Edit Test Domain")).toBeInTheDocument();
  });

  it("should show pagination when there are more items than limit", () => {
    const { api } = require("~/trpc/react");
    api.property.list.useQuery.mockReturnValue({
      data: {
        ...mockPropertiesData,
        total: 25,
      },
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    render(<PropertyList />);

    expect(screen.getByText("Showing 1 to 10 of 25 properties")).toBeInTheDocument();
    expect(screen.getByText("Previous")).toBeInTheDocument();
    expect(screen.getByText("Next")).toBeInTheDocument();
  });

  it("should show loading state", () => {
    const { api } = require("~/trpc/react");
    api.property.list.useQuery.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
      refetch: mockRefetch,
    });

    render(<PropertyList />);

    expect(screen.getByText("Loading properties...")).toBeInTheDocument();
  });

  it("should show error state", () => {
    const { api } = require("~/trpc/react");
    api.property.list.useQuery.mockReturnValue({
      data: null,
      isLoading: false,
      error: { message: "Failed to load properties" },
      refetch: mockRefetch,
    });

    render(<PropertyList />);

    expect(screen.getByText("Failed to load properties: Failed to load properties")).toBeInTheDocument();
  });

  it("should display property descriptions correctly", () => {
    render(<PropertyList />);

    expect(screen.getByText("A test server for development")).toBeInTheDocument();
    expect(screen.getByText("A test domain")).toBeInTheDocument();
  });

  it("should handle properties without descriptions", () => {
    const { api } = require("~/trpc/react");
    api.property.list.useQuery.mockReturnValue({
      data: {
        properties: [
          {
            ...mockPropertiesData.properties[0],
            description: null,
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
      },
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    render(<PropertyList />);

    expect(screen.getByText("No description")).toBeInTheDocument();
  });
});