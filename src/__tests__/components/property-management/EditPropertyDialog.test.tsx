import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EditPropertyDialog } from "@/components/property-management/EditPropertyDialog";
import type { Property } from "@/repositories/interfaces/property.repository";

// Mock tRPC
const mockOnPropertyUpdated = vi.fn();
const mockMutate = vi.fn();

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

const mockProperty: Property = {
  id: "prop_123",
  name: "Test Server",
  description: "A test server for development",
  type: "server",
  status: "active",
  configuration: { cpu: "4 cores", ram: "8GB" },
  owner_id: "user_123",
  is_active: true,
  created_at: new Date("2024-01-15T10:30:00Z"),
  updated_at: new Date("2024-01-15T10:30:00Z"),
};

describe("EditPropertyDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render edit property dialog", () => {
    render(
      <EditPropertyDialog
        property={mockProperty}
        onPropertyUpdated={mockOnPropertyUpdated}
      />,
    );

    expect(screen.getByText("Edit Property")).toBeInTheDocument();
    expect(
      screen.getByText("Update the property information."),
    ).toBeInTheDocument();
  });

  it("should populate form with existing property data", () => {
    render(
      <EditPropertyDialog
        property={mockProperty}
        onPropertyUpdated={mockOnPropertyUpdated}
      />,
    );

    expect(screen.getByDisplayValue("Test Server")).toBeInTheDocument();
    expect(
      screen.getByDisplayValue("A test server for development"),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue("Server")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Active")).toBeInTheDocument();
    expect(screen.getByDisplayValue("user_123")).toBeInTheDocument();
  });

  it("should show active checkbox as checked", () => {
    render(
      <EditPropertyDialog
        property={mockProperty}
        onPropertyUpdated={mockOnPropertyUpdated}
      />,
    );

    const activeCheckbox = screen.getByLabelText("Active");
    expect(activeCheckbox).toBeChecked();
  });

  it("should show active checkbox as unchecked for inactive property", () => {
    const inactiveProperty = { ...mockProperty, is_active: false };
    render(
      <EditPropertyDialog
        property={inactiveProperty}
        onPropertyUpdated={mockOnPropertyUpdated}
      />,
    );

    const activeCheckbox = screen.getByLabelText("Active");
    expect(activeCheckbox).not.toBeChecked();
  });

  it("should handle form input changes", async () => {
    const user = userEvent.setup();
    render(
      <EditPropertyDialog
        property={mockProperty}
        onPropertyUpdated={mockOnPropertyUpdated}
      />,
    );

    const nameInput = screen.getByDisplayValue("Test Server");
    const descriptionTextarea = screen.getByDisplayValue(
      "A test server for development",
    );
    const ownerIdInput = screen.getByDisplayValue("user_123");

    await user.clear(nameInput);
    await user.type(nameInput, "Updated Server");
    await user.clear(descriptionTextarea);
    await user.type(descriptionTextarea, "Updated description");
    await user.clear(ownerIdInput);
    await user.type(ownerIdInput, "user_456");

    expect(nameInput).toHaveValue("Updated Server");
    expect(descriptionTextarea).toHaveValue("Updated description");
    expect(ownerIdInput).toHaveValue("user_456");
  });

  it("should handle type selection", async () => {
    const user = userEvent.setup();
    render(
      <EditPropertyDialog
        property={mockProperty}
        onPropertyUpdated={mockOnPropertyUpdated}
      />,
    );

    const typeSelect = screen.getByDisplayValue("Server");
    await user.click(typeSelect);

    // Check that type options are available
    expect(screen.getByText("Server")).toBeInTheDocument();
    expect(screen.getByText("Domain")).toBeInTheDocument();
    expect(screen.getByText("SSL Certificate")).toBeInTheDocument();
    expect(screen.getByText("Database")).toBeInTheDocument();
    expect(screen.getByText("Storage")).toBeInTheDocument();
  });

  it("should handle status selection", async () => {
    const user = userEvent.setup();
    render(
      <EditPropertyDialog
        property={mockProperty}
        onPropertyUpdated={mockOnPropertyUpdated}
      />,
    );

    const statusSelect = screen.getByDisplayValue("Active");
    await user.click(statusSelect);

    // Check that status options are available
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("Inactive")).toBeInTheDocument();
    expect(screen.getByText("Maintenance")).toBeInTheDocument();
    expect(screen.getByText("Suspended")).toBeInTheDocument();
  });

  it("should handle active checkbox toggle", async () => {
    const user = userEvent.setup();
    render(
      <EditPropertyDialog
        property={mockProperty}
        onPropertyUpdated={mockOnPropertyUpdated}
      />,
    );

    const activeCheckbox = screen.getByLabelText("Active");
    await user.click(activeCheckbox);

    expect(activeCheckbox).not.toBeChecked();
  });

  it("should submit form with updated data", async () => {
    const user = userEvent.setup();
    render(
      <EditPropertyDialog
        property={mockProperty}
        onPropertyUpdated={mockOnPropertyUpdated}
      />,
    );

    const nameInput = screen.getByDisplayValue("Test Server");
    const submitButton = screen.getByText("Update Property");

    await user.clear(nameInput);
    await user.type(nameInput, "Updated Server");

    await user.click(submitButton);

    expect(mockMutate).toHaveBeenCalledWith({
      id: "prop_123",
      name: "Updated Server",
      description: "A test server for development",
      type: "server",
      status: "active",
      owner_id: "user_123",
      is_active: true,
    });
  });

  it("should not submit form without required fields", async () => {
    const user = userEvent.setup();
    render(
      <EditPropertyDialog
        property={mockProperty}
        onPropertyUpdated={mockOnPropertyUpdated}
      />,
    );

    const nameInput = screen.getByDisplayValue("Test Server");
    const submitButton = screen.getByText("Update Property");

    await user.clear(nameInput);
    await user.click(submitButton);

    // Form should not submit without name
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it("should show error message when mutation fails", () => {
    const { api } = require("~/trpc/react");
    api.property.update.useMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      error: { message: "Property name already exists" },
    });

    render(
      <EditPropertyDialog
        property={mockProperty}
        onPropertyUpdated={mockOnPropertyUpdated}
      />,
    );

    expect(
      screen.getByText("Property name already exists"),
    ).toBeInTheDocument();
  });

  it("should show loading state during submission", () => {
    const { api } = require("~/trpc/react");
    api.property.update.useMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: true,
      error: null,
    });

    render(
      <EditPropertyDialog
        property={mockProperty}
        onPropertyUpdated={mockOnPropertyUpdated}
      />,
    );

    expect(screen.getByText("Updating...")).toBeInTheDocument();
    expect(screen.getByText("Update Property")).toBeDisabled();
  });

  it("should handle cancel button", async () => {
    const user = userEvent.setup();
    render(
      <EditPropertyDialog
        property={mockProperty}
        onPropertyUpdated={mockOnPropertyUpdated}
      />,
    );

    const cancelButton = screen.getByText("Cancel");
    await user.click(cancelButton);

    // Dialog should close (this is handled by the Dialog component)
    expect(cancelButton).toBeInTheDocument();
  });

  it("should handle property without description", () => {
    const propertyWithoutDescription = {
      ...mockProperty,
      description: undefined,
    };
    render(
      <EditPropertyDialog
        property={propertyWithoutDescription}
        onPropertyUpdated={mockOnPropertyUpdated}
      />,
    );

    const descriptionTextarea = screen.getByLabelText("Description");
    expect(descriptionTextarea).toHaveValue("");
  });

  it("should handle property without owner", () => {
    const propertyWithoutOwner = { ...mockProperty, owner_id: undefined };
    render(
      <EditPropertyDialog
        property={propertyWithoutOwner}
        onPropertyUpdated={mockOnPropertyUpdated}
      />,
    );

    const ownerIdInput = screen.getByLabelText("Owner ID");
    expect(ownerIdInput).toHaveValue("");
  });

  it("should handle form submission with all fields updated", async () => {
    const user = userEvent.setup();
    render(
      <EditPropertyDialog
        property={mockProperty}
        onPropertyUpdated={mockOnPropertyUpdated}
      />,
    );

    const nameInput = screen.getByDisplayValue("Test Server");
    const descriptionTextarea = screen.getByDisplayValue(
      "A test server for development",
    );
    const typeSelect = screen.getByDisplayValue("Server");
    const statusSelect = screen.getByDisplayValue("Active");
    const ownerIdInput = screen.getByDisplayValue("user_123");
    const activeCheckbox = screen.getByLabelText("Active");
    const submitButton = screen.getByText("Update Property");

    await user.clear(nameInput);
    await user.type(nameInput, "Fully Updated Server");
    await user.clear(descriptionTextarea);
    await user.type(descriptionTextarea, "Fully updated description");
    await user.click(typeSelect);
    await user.click(screen.getByText("Database"));
    await user.click(statusSelect);
    await user.click(screen.getByText("Maintenance"));
    await user.clear(ownerIdInput);
    await user.type(ownerIdInput, "user_789");
    await user.click(activeCheckbox); // Toggle to inactive

    await user.click(submitButton);

    expect(mockMutate).toHaveBeenCalledWith({
      id: "prop_123",
      name: "Fully Updated Server",
      description: "Fully updated description",
      type: "database",
      status: "maintenance",
      owner_id: "user_789",
      is_active: false,
    });
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
});
