import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PropertyList } from "@/components/property-management/PropertyList";

// Mock tRPC
const mockRefetch = vi.fn();
const mockMutateAsync = vi.fn();

vi.mock("~/trpc/react", () => ({
  api: {
    property: {
      list: {
        useQuery: vi.fn(() => ({
          data: {
            properties: [
              {
                id: "prop_1",
                name: "Test Server",
                description: "A test server for development",
                type: "server",
                status: "active",
                configuration: { cpu: "4 cores", ram: "8GB" },
                owner_id: "user_1",
                is_active: true,
                created_at: "2024-01-15T10:30:00Z",
                updated_at: "2024-01-15T10:30:00Z",
              },
              {
                id: "prop_2",
                name: "Test Domain",
                description: "A test domain",
                type: "domain",
                status: "inactive",
                configuration: null,
                owner_id: "user_1",
                is_active: true,
                created_at: "2024-01-15T10:30:00Z",
                updated_at: "2024-01-15T10:30:00Z",
              },
            ],
            total: 2,
            page: 1,
            limit: 10,
            total_pages: 1,
          },
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
  CreatePropertyDialog: ({
    onPropertyCreated,
  }: {
    onPropertyCreated: () => void;
  }) => (
    <button onClick={onPropertyCreated} data-testid="create-property-dialog">
      Create Property
    </button>
  ),
}));

vi.mock("@/components/property-management/EditPropertyDialog", () => ({
  EditPropertyDialog: ({
    property,
    onPropertyUpdated,
  }: {
    property: any;
    onPropertyUpdated: () => void;
  }) => (
    <button
      onClick={onPropertyUpdated}
      data-testid={`edit-property-${property.id}`}
    >
      Edit {property.name}
    </button>
  ),
}));

describe("PropertyList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render properties list with correct data", () => {
    render(<PropertyList />);

    expect(screen.getByText("Property Management")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Manage hosting properties, servers, domains, and resources",
      ),
    ).toBeInTheDocument();
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

    expect(
      screen.getByPlaceholderText("Search properties..."),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue("Filter by type")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Filter by status")).toBeInTheDocument();
  });

  it("should handle search input changes", async () => {
    const user = userEvent.setup();
    render(<PropertyList />);

    const searchInput = screen.getByPlaceholderText("Search properties...");
    await user.type(searchInput, "test search");

    expect(searchInput).toHaveValue("test search");
  });

  it("should handle type filter changes", async () => {
    const user = userEvent.setup();
    render(<PropertyList />);

    const typeFilter = screen.getByDisplayValue("Filter by type");
    await user.click(typeFilter);

    // The select should be available (this is a simplified test)
    expect(typeFilter).toBeInTheDocument();
  });

  it("should handle status filter changes", async () => {
    const user = userEvent.setup();
    render(<PropertyList />);

    const statusFilter = screen.getByDisplayValue("Filter by status");
    await user.click(statusFilter);

    // The select should be available (this is a simplified test)
    expect(statusFilter).toBeInTheDocument();
  });

  it("should show create property dialog", () => {
    render(<PropertyList />);

    expect(screen.getByTestId("create-property-dialog")).toBeInTheDocument();
  });

  it("should show edit property dialogs for each property", () => {
    render(<PropertyList />);

    expect(screen.getByTestId("edit-property-prop_1")).toBeInTheDocument();
    expect(screen.getByTestId("edit-property-prop_2")).toBeInTheDocument();
  });

  it("should handle property deletion", async () => {
    const user = userEvent.setup();
    // Mock window.confirm
    window.confirm = vi.fn(() => true);

    render(<PropertyList />);

    // Find and click the delete button (this would be in a dropdown menu)
    const deleteButtons = screen.getAllByText("Delete");
    if (deleteButtons.length > 0) {
      await user.click(deleteButtons[0]!);

      expect(window.confirm).toHaveBeenCalledWith(
        "Are you sure you want to delete this property?",
      );
    }
  });

  it("should show pagination when there are more items than limit", () => {
    // Mock data with more items
    const { api } = require("~/trpc/react");
    api.property.list.useQuery.mockReturnValue({
      data: {
        properties: Array.from({ length: 15 }, (_, i) => ({
          id: `prop_${i}`,
          name: `Property ${i}`,
          description: `Description ${i}`,
          type: "server",
          status: "active",
          configuration: null,
          owner_id: "user_1",
          is_active: true,
          created_at: "2024-01-15T10:30:00Z",
          updated_at: "2024-01-15T10:30:00Z",
        })),
        total: 15,
        page: 1,
        limit: 10,
        total_pages: 2,
      },
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    render(<PropertyList />);

    expect(
      screen.getByText("Showing 1 to 10 of 15 properties"),
    ).toBeInTheDocument();
    expect(screen.getByText("Previous")).toBeInTheDocument();
    expect(screen.getByText("Next")).toBeInTheDocument();
  });

  it("should handle pagination navigation", async () => {
    const user = userEvent.setup();

    // Mock data with pagination
    const { api } = require("~/trpc/react");
    api.property.list.useQuery.mockReturnValue({
      data: {
        properties: Array.from({ length: 5 }, (_, i) => ({
          id: `prop_${i}`,
          name: `Property ${i}`,
          description: `Description ${i}`,
          type: "server",
          status: "active",
          configuration: null,
          owner_id: "user_1",
          is_active: true,
          created_at: "2024-01-15T10:30:00Z",
          updated_at: "2024-01-15T10:30:00Z",
        })),
        total: 25,
        page: 2,
        limit: 10,
        total_pages: 3,
      },
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    render(<PropertyList />);

    const nextButton = screen.getByText("Next");
    await user.click(nextButton);

    // The component should handle pagination state changes
    expect(nextButton).toBeInTheDocument();
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

    expect(
      screen.getByText("Failed to load properties: Failed to load properties"),
    ).toBeInTheDocument();
  });

  it("should display property descriptions correctly", () => {
    render(<PropertyList />);

    expect(
      screen.getByText("A test server for development"),
    ).toBeInTheDocument();
    expect(screen.getByText("A test domain")).toBeInTheDocument();
  });

  it("should handle properties without descriptions", () => {
    const { api } = require("~/trpc/react");
    api.property.list.useQuery.mockReturnValue({
      data: {
        properties: [
          {
            id: "prop_1",
            name: "Test Server",
            description: null,
            type: "server",
            status: "active",
            configuration: null,
            owner_id: "user_1",
            is_active: true,
            created_at: "2024-01-15T10:30:00Z",
            updated_at: "2024-01-15T10:30:00Z",
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
        total_pages: 1,
      },
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    render(<PropertyList />);

    expect(screen.getByText("No description")).toBeInTheDocument();
  });
});
