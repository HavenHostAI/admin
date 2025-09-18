import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EditPropertyDialog } from "@/components/property-management/EditPropertyDialog";

// Mock tRPC
const mockOnPropertyUpdated = vi.fn();
const mockMutate = vi.fn();

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
          mutate: mockMutate,
          isPending: false,
          error: null,
        })),
      },
    },
  },
}));

describe("EditPropertyDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render edit button trigger", () => {
    render(<EditPropertyDialog property={mockProperty} onPropertyUpdated={mockOnPropertyUpdated} />);

    expect(screen.getByText("Edit")).toBeInTheDocument();
  });

  it("should show form fields when dialog is opened", async () => {
    const user = userEvent.setup();
    render(<EditPropertyDialog property={mockProperty} onPropertyUpdated={mockOnPropertyUpdated} />);

    // Click the trigger button to open the dialog
    const triggerButton = screen.getByText("Edit");
    await user.click(triggerButton);

    // Wait for the dialog to open and check for form fields
    await waitFor(() => {
      expect(screen.getByText("Edit hosting property details.")).toBeInTheDocument();
    });

    expect(screen.getByLabelText("Name *")).toBeInTheDocument();
    expect(screen.getByLabelText("Type *")).toBeInTheDocument();
    expect(screen.getByLabelText("Status")).toBeInTheDocument();
    expect(screen.getByLabelText("Description")).toBeInTheDocument();
    expect(screen.getByLabelText("Owner ID")).toBeInTheDocument();
  });

  it("should pre-populate form with property data", async () => {
    const user = userEvent.setup();
    render(<EditPropertyDialog property={mockProperty} onPropertyUpdated={mockOnPropertyUpdated} />);

    // Open the dialog
    const triggerButton = screen.getByText("Edit");
    await user.click(triggerButton);

    await waitFor(() => {
      const nameInput = screen.getByDisplayValue("Test Server");
      expect(nameInput).toBeInTheDocument();
    });

    expect(screen.getByDisplayValue("Test Server")).toBeInTheDocument();
    expect(screen.getByDisplayValue("A test server for development")).toBeInTheDocument();
    expect(screen.getByDisplayValue("user_123")).toBeInTheDocument();
  });

  it("should handle form input changes", async () => {
    const user = userEvent.setup();
    render(<EditPropertyDialog property={mockProperty} onPropertyUpdated={mockOnPropertyUpdated} />);

    // Open the dialog
    const triggerButton = screen.getByText("Edit");
    await user.click(triggerButton);

    await waitFor(() => {
      const nameInput = screen.getByDisplayValue("Test Server");
      expect(nameInput).toBeInTheDocument();
    });

    const nameInput = screen.getByDisplayValue("Test Server");
    await user.clear(nameInput);
    await user.type(nameInput, "Updated Server Name");

    expect(nameInput).toHaveValue("Updated Server Name");
  });

  it("should submit form with updated data", async () => {
    const user = userEvent.setup();
    render(<EditPropertyDialog property={mockProperty} onPropertyUpdated={mockOnPropertyUpdated} />);

    // Open the dialog
    const triggerButton = screen.getByText("Edit");
    await user.click(triggerButton);

    await waitFor(() => {
      const nameInput = screen.getByDisplayValue("Test Server");
      expect(nameInput).toBeInTheDocument();
    });

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

  it("should show error message when mutation fails", () => {
    const { api } = require("~/trpc/react");
    api.property.update.useMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      error: { message: "Failed to update property" },
    });

    render(<EditPropertyDialog property={mockProperty} onPropertyUpdated={mockOnPropertyUpdated} />);

    expect(screen.getByText("Failed to update property")).toBeInTheDocument();
  });

  it("should show loading state during submission", () => {
    const { api } = require("~/trpc/react");
    api.property.update.useMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: true,
      error: null,
    });

    render(<EditPropertyDialog property={mockProperty} onPropertyUpdated={mockOnPropertyUpdated} />);

    expect(screen.getByText("Updating...")).toBeInTheDocument();
  });

  it("should handle cancel button", async () => {
    const user = userEvent.setup();
    render(<EditPropertyDialog property={mockProperty} onPropertyUpdated={mockOnPropertyUpdated} />);

    // Open the dialog
    const triggerButton = screen.getByText("Edit");
    await user.click(triggerButton);

    await waitFor(() => {
      const cancelButton = screen.getByText("Cancel");
      expect(cancelButton).toBeInTheDocument();
    });

    const cancelButton = screen.getByText("Cancel");
    await user.click(cancelButton);

    // Dialog should be closed
    expect(screen.queryByText("Edit hosting property details.")).not.toBeInTheDocument();
  });
});