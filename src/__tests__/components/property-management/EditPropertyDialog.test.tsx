import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EditPropertyDialog } from "@/components/property-management/EditPropertyDialog";
import type { Mock } from "vitest";

type TrpcReactModule = typeof import("~/trpc/react");
type PropertyUpdateMutationHook =
  TrpcReactModule["api"]["property"]["update"]["useMutation"];
type PropertyUpdateMutationResult = ReturnType<PropertyUpdateMutationHook>;

// Mock tRPC
const mockOnPropertyUpdated = vi.fn();
let mockMutate: ReturnType<typeof vi.fn>;
let updateUseMutationMock: Mock<
  Parameters<PropertyUpdateMutationHook>,
  PropertyUpdateMutationResult
>;

const mockProperty = {
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
};

vi.mock("~/trpc/react", () => ({
  api: {
    property: {
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

describe("EditPropertyDialog", () => {
  const openDialog = async (user = userEvent.setup()) => {
    render(
      <EditPropertyDialog
        property={mockProperty}
        onPropertyUpdated={mockOnPropertyUpdated}
      />,
    );

    const triggerButton = screen.getByText("Edit");
    await user.click(triggerButton);
    await screen.findByText("Update the property information.");

    return { user };
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    mockMutate = vi.fn();

    const { api } = await import("~/trpc/react");
    updateUseMutationMock = vi.mocked(api.property.update.useMutation);

    updateUseMutationMock.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      error: null,
    } as PropertyUpdateMutationResult);
  });

  it("should render edit button trigger", () => {
    render(
      <EditPropertyDialog
        property={mockProperty}
        onPropertyUpdated={mockOnPropertyUpdated}
      />,
    );

    expect(screen.getByText("Edit")).toBeInTheDocument();
  });

  it("should show form fields when dialog is opened", async () => {
    await openDialog();

    expect(screen.getByLabelText("Name *")).toBeInTheDocument();
    expect(screen.getByLabelText("Type *")).toBeInTheDocument();
    expect(screen.getByLabelText("Status")).toBeInTheDocument();
    expect(screen.getByLabelText("Description")).toBeInTheDocument();
    expect(screen.getByLabelText("Owner ID")).toBeInTheDocument();
  });

  it("should pre-populate form with property data", async () => {
    await openDialog();

    expect(screen.getByDisplayValue("Test Server")).toBeInTheDocument();
    expect(
      screen.getByDisplayValue("A test server for development"),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue("user_123")).toBeInTheDocument();
  });

  it("should handle form input changes", async () => {
    const { user } = await openDialog();

    const nameInput = screen.getByDisplayValue("Test Server");
    await user.clear(nameInput);
    await user.type(nameInput, "Updated Server Name");

    expect(nameInput).toHaveValue("Updated Server Name");
  });

  it("should submit form with updated data", async () => {
    const { user } = await openDialog();

    // Update the form
    const nameInput = screen.getByDisplayValue("Test Server");
    await user.clear(nameInput);
    await user.type(nameInput, "Updated Server");

    // Submit the form
    const submitButton = screen.getByText("Update Property");
    await user.click(submitButton);

    expect(mockMutate).toHaveBeenCalledWith({
      id: "1",
      name: "Updated Server",
      description: "A test server for development",
      type: "server",
      status: "active",
      owner_id: "user_123",
      is_active: true,
    });
  });

  it("should show error message when mutation fails", async () => {
    updateUseMutationMock.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      error: { message: "Failed to update property" },
    });

    await openDialog();

    expect(screen.getByText("Failed to update property")).toBeInTheDocument();
  });

  it("should show loading state during submission", async () => {
    updateUseMutationMock.mockReturnValue({
      mutate: mockMutate,
      isPending: true,
      error: null,
    });

    await openDialog();

    expect(screen.getByText("Updating...")).toBeInTheDocument();
  });

  it("should handle cancel button", async () => {
    const { user } = await openDialog();

    const cancelButton = screen.getByText("Cancel");
    await user.click(cancelButton);

    // Dialog should be closed
    expect(
      screen.queryByText("Update the property information."),
    ).not.toBeInTheDocument();
  });
});
