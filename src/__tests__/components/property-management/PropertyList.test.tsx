import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PropertyList } from "@/components/property-management/PropertyList";
import type { MockedFunction } from "vitest";

type TrpcReactModule = typeof import("~/trpc/react");
type PropertyListQueryHook =
  TrpcReactModule["api"]["property"]["list"]["useQuery"];
type PropertyListQueryResult = ReturnType<PropertyListQueryHook>;
type PropertyDeleteMutationHook =
  TrpcReactModule["api"]["property"]["delete"]["useMutation"];
type PropertyDeleteMutationResult = ReturnType<PropertyDeleteMutationHook>;

// Mock tRPC
let mockRefetch: ReturnType<typeof vi.fn>;
let mockMutateAsync: ReturnType<typeof vi.fn>;
let listUseQueryMock: MockedFunction<PropertyListQueryHook>;
let deleteUseMutationMock: MockedFunction<PropertyDeleteMutationHook>;

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
      created_at: new Date("2024-01-01T00:00:00Z"),
      updated_at: new Date("2024-01-02T00:00:00Z"),
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
      created_at: new Date("2024-01-03T00:00:00Z"),
      updated_at: new Date("2024-01-04T00:00:00Z"),
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
      update: {
        useMutation: vi.fn(() => ({
          mutate: vi.fn(),
          isPending: false,
          error: null,
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
  }) => <button onClick={onPropertyCreated}>Create Property</button>,
}));

describe("PropertyList", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockRefetch = vi.fn();
    mockMutateAsync = vi.fn();

    const { api } = await import("~/trpc/react");
    listUseQueryMock = vi.mocked(api.property.list.useQuery);
    deleteUseMutationMock = vi.mocked(api.property.delete.useMutation);

    listUseQueryMock.mockReturnValue({
      data: mockPropertiesData,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    } as unknown as PropertyListQueryResult);

    deleteUseMutationMock.mockReturnValue({
      mutateAsync: mockMutateAsync,
    } as unknown as PropertyDeleteMutationResult);
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

  it("should render edit dialogs for each property", async () => {
    const user = userEvent.setup();
    render(<PropertyList />);

    const actionButtons = screen.getAllByLabelText(/Actions for/i);
    expect(actionButtons).toHaveLength(mockPropertiesData.properties.length);

    const [firstActionButton] = actionButtons;
    if (!firstActionButton) {
      throw new Error("Expected at least one action button");
    }

    await user.click(firstActionButton);
    const editMenuButton = await screen.findByRole("button", { name: "Edit" });
    await user.click(editMenuButton);

    expect(await screen.findByText("Edit Property")).toBeInTheDocument();
  });

  it("should show pagination when there are more items than limit", () => {
    listUseQueryMock.mockReturnValue({
      data: {
        ...mockPropertiesData,
        total: 25,
      },
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    } as unknown as PropertyListQueryResult);

    render(<PropertyList />);

    expect(
      screen.getByText("Showing 1 to 10 of 25 properties"),
    ).toBeInTheDocument();
    expect(screen.getByText("Previous")).toBeInTheDocument();
    expect(screen.getByText("Next")).toBeInTheDocument();
  });

  it("should show loading state", () => {
    listUseQueryMock.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
      refetch: mockRefetch,
    } as unknown as PropertyListQueryResult);

    render(<PropertyList />);

    expect(screen.getByText("Loading properties...")).toBeInTheDocument();
  });

  it("should show error state", () => {
    listUseQueryMock.mockReturnValue({
      data: null,
      isLoading: false,
      error: {
        message: "Failed to load properties",
      } as unknown as PropertyListQueryResult["error"],
      refetch: mockRefetch,
    } as unknown as PropertyListQueryResult);

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
    listUseQueryMock.mockReturnValue({
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
    } as unknown as PropertyListQueryResult);

    render(<PropertyList />);

    expect(screen.getByText("No description")).toBeInTheDocument();
  });
});
