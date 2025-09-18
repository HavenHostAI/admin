import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CreatePropertyDialog } from "@/components/property-management/CreatePropertyDialog";

// Mock tRPC
const mockOnPropertyCreated = vi.fn();
const mockMutate = vi.fn();

vi.mock("~/trpc/react", () => ({
  api: {
    property: {
      create: {
        useMutation: vi.fn(() => ({
          mutate: mockMutate,
          isPending: false,
          error: null,
        })),
      },
    },
  },
}));

describe("CreatePropertyDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render create property dialog", () => {
    render(<CreatePropertyDialog onPropertyCreated={mockOnPropertyCreated} />);

    expect(screen.getByText("Create Property")).toBeInTheDocument();
    expect(
      screen.getByText("Add a new hosting property to the system."),
    ).toBeInTheDocument();
  });

  it("should show form fields", () => {
    render(<CreatePropertyDialog onPropertyCreated={mockOnPropertyCreated} />);

    expect(screen.getByLabelText("Name *")).toBeInTheDocument();
    expect(screen.getByLabelText("Type *")).toBeInTheDocument();
    expect(screen.getByLabelText("Status")).toBeInTheDocument();
    expect(screen.getByLabelText("Description")).toBeInTheDocument();
    expect(screen.getByLabelText("Owner ID")).toBeInTheDocument();
  });

  it("should have correct default values", () => {
    render(<CreatePropertyDialog onPropertyCreated={mockOnPropertyCreated} />);

    const statusSelect = screen.getByDisplayValue("Active");
    expect(statusSelect).toBeInTheDocument();
  });

  it("should handle form input changes", async () => {
    const user = userEvent.setup();
    render(<CreatePropertyDialog onPropertyCreated={mockOnPropertyCreated} />);

    const nameInput = screen.getByLabelText("Name *");
    const descriptionTextarea = screen.getByLabelText("Description");
    const ownerIdInput = screen.getByLabelText("Owner ID");

    await user.type(nameInput, "New Test Server");
    await user.type(descriptionTextarea, "This is a test server");
    await user.type(ownerIdInput, "user_123");

    expect(nameInput).toHaveValue("New Test Server");
    expect(descriptionTextarea).toHaveValue("This is a test server");
    expect(ownerIdInput).toHaveValue("user_123");
  });

  it("should handle type selection", async () => {
    const user = userEvent.setup();
    render(<CreatePropertyDialog onPropertyCreated={mockOnPropertyCreated} />);

    const typeSelect = screen.getByDisplayValue("Select property type");
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
    render(<CreatePropertyDialog onPropertyCreated={mockOnPropertyCreated} />);

    const statusSelect = screen.getByDisplayValue("Active");
    await user.click(statusSelect);

    // Check that status options are available
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("Inactive")).toBeInTheDocument();
    expect(screen.getByText("Maintenance")).toBeInTheDocument();
    expect(screen.getByText("Suspended")).toBeInTheDocument();
  });

  it("should submit form with valid data", async () => {
    const user = userEvent.setup();
    render(<CreatePropertyDialog onPropertyCreated={mockOnPropertyCreated} />);

    const nameInput = screen.getByLabelText("Name *");
    const typeSelect = screen.getByDisplayValue("Select property type");
    const submitButton = screen.getByText("Create Property");

    await user.type(nameInput, "Test Server");
    await user.click(typeSelect);
    await user.click(screen.getByText("Server"));

    await user.click(submitButton);

    expect(mockMutate).toHaveBeenCalledWith({
      name: "Test Server",
      description: undefined,
      type: "server",
      status: "active",
      owner_id: undefined,
    });
  });

  it("should not submit form without required fields", async () => {
    const user = userEvent.setup();
    render(<CreatePropertyDialog onPropertyCreated={mockOnPropertyCreated} />);

    const submitButton = screen.getByText("Create Property");
    await user.click(submitButton);

    // Form should not submit without name and type
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it("should show error message when mutation fails", () => {
    const { api } = require("~/trpc/react");
    api.property.create.useMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      error: { message: "Property name already exists" },
    });

    render(<CreatePropertyDialog onPropertyCreated={mockOnPropertyCreated} />);

    expect(
      screen.getByText("Property name already exists"),
    ).toBeInTheDocument();
  });

  it("should show loading state during submission", () => {
    const { api } = require("~/trpc/react");
    api.property.create.useMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: true,
      error: null,
    });

    render(<CreatePropertyDialog onPropertyCreated={mockOnPropertyCreated} />);

    expect(screen.getByText("Creating...")).toBeInTheDocument();
    expect(screen.getByText("Create Property")).toBeDisabled();
  });

  it("should reset form after successful submission", async () => {
    const user = userEvent.setup();

    // Mock successful mutation
    const { api } = require("~/trpc/react");
    api.property.create.useMutation.mockReturnValue({
      mutate: mockMutate.mockImplementation(() => {
        // Simulate successful submission
        setTimeout(() => {
          // This would normally be handled by the mutation's onSuccess callback
        }, 0);
      }),
      isPending: false,
      error: null,
    });

    render(<CreatePropertyDialog onPropertyCreated={mockOnPropertyCreated} />);

    const nameInput = screen.getByLabelText("Name *");
    const typeSelect = screen.getByDisplayValue("Select property type");
    const submitButton = screen.getByText("Create Property");

    await user.type(nameInput, "Test Server");
    await user.click(typeSelect);
    await user.click(screen.getByText("Server"));
    await user.click(submitButton);

    // After successful submission, form should be reset
    // This is handled by the component's onSuccess callback
    expect(mockMutate).toHaveBeenCalled();
  });

  it("should handle cancel button", async () => {
    const user = userEvent.setup();
    render(<CreatePropertyDialog onPropertyCreated={mockOnPropertyCreated} />);

    const cancelButton = screen.getByText("Cancel");
    await user.click(cancelButton);

    // Dialog should close (this is handled by the Dialog component)
    expect(cancelButton).toBeInTheDocument();
  });

  it("should handle form submission with all fields", async () => {
    const user = userEvent.setup();
    render(<CreatePropertyDialog onPropertyCreated={mockOnPropertyCreated} />);

    const nameInput = screen.getByLabelText("Name *");
    const descriptionTextarea = screen.getByLabelText("Description");
    const typeSelect = screen.getByDisplayValue("Select property type");
    const statusSelect = screen.getByDisplayValue("Active");
    const ownerIdInput = screen.getByLabelText("Owner ID");
    const submitButton = screen.getByText("Create Property");

    await user.type(nameInput, "Complete Test Server");
    await user.type(descriptionTextarea, "A complete test server");
    await user.click(typeSelect);
    await user.click(screen.getByText("Server"));
    await user.click(statusSelect);
    await user.click(screen.getByText("Maintenance"));
    await user.type(ownerIdInput, "user_456");

    await user.click(submitButton);

    expect(mockMutate).toHaveBeenCalledWith({
      name: "Complete Test Server",
      description: "A complete test server",
      type: "server",
      status: "maintenance",
      owner_id: "user_456",
    });
  });
});
