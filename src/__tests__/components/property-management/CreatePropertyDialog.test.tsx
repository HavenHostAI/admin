import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
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

  it("should render create property dialog trigger", () => {
    render(<CreatePropertyDialog onPropertyCreated={mockOnPropertyCreated} />);

    expect(screen.getByText("Create Property")).toBeInTheDocument();
  });

  it("should show form fields when dialog is opened", async () => {
    const user = userEvent.setup();
    render(<CreatePropertyDialog onPropertyCreated={mockOnPropertyCreated} />);

    // Click the trigger button to open the dialog
    const triggerButton = screen.getByText("Create Property");
    await user.click(triggerButton);

    // Wait for the dialog to open and check for form fields
    await waitFor(() => {
      expect(screen.getByText("Add a new hosting property to the system.")).toBeInTheDocument();
    });

    expect(screen.getByLabelText("Name *")).toBeInTheDocument();
    expect(screen.getByLabelText("Type *")).toBeInTheDocument();
    expect(screen.getByLabelText("Status")).toBeInTheDocument();
    expect(screen.getByLabelText("Description")).toBeInTheDocument();
    expect(screen.getByLabelText("Owner ID")).toBeInTheDocument();
  });

  it("should have correct default values when dialog is opened", async () => {
    const user = userEvent.setup();
    render(<CreatePropertyDialog onPropertyCreated={mockOnPropertyCreated} />);

    // Open the dialog
    const triggerButton = screen.getByText("Create Property");
    await user.click(triggerButton);

    await waitFor(() => {
      expect(screen.getByDisplayValue("Active")).toBeInTheDocument();
    });
  });

  it("should handle form input changes", async () => {
    const user = userEvent.setup();
    render(<CreatePropertyDialog onPropertyCreated={mockOnPropertyCreated} />);

    // Open the dialog
    const triggerButton = screen.getByText("Create Property");
    await user.click(triggerButton);

    await waitFor(() => {
      const nameInput = screen.getByLabelText("Name *");
      expect(nameInput).toBeInTheDocument();
    });

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

  it("should submit form with valid data", async () => {
    const user = userEvent.setup();
    render(<CreatePropertyDialog onPropertyCreated={mockOnPropertyCreated} />);

    // Open the dialog
    const triggerButton = screen.getByText("Create Property");
    await user.click(triggerButton);

    await waitFor(() => {
      const nameInput = screen.getByLabelText("Name *");
      expect(nameInput).toBeInTheDocument();
    });

    // Fill out the form
    const nameInput = screen.getByLabelText("Name *");
    const descriptionTextarea = screen.getByLabelText("Description");
    const ownerIdInput = screen.getByLabelText("Owner ID");

    await user.type(nameInput, "Test Server");
    await user.type(descriptionTextarea, "A test server");
    await user.type(ownerIdInput, "user_123");

    // Submit the form - use the submit button specifically
    const submitButtons = screen.getAllByText("Create Property");
    const submitButton = submitButtons.find(button => button.getAttribute("type") === "submit");
    expect(submitButton).toBeDefined();
    
    if (submitButton) {
      await user.click(submitButton);
    }

    expect(mockMutate).toHaveBeenCalledWith({
      name: "Test Server",
      description: "A test server",
      type: "server",
      status: "active",
      owner_id: "user_123",
      configuration: {},
    });
  });

  it("should show error message when mutation fails", () => {
    const { api } = require("~/trpc/react");
    api.property.create.useMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      error: { message: "Failed to create property" },
    });

    render(<CreatePropertyDialog onPropertyCreated={mockOnPropertyCreated} />);

    expect(screen.getByText("Failed to create property")).toBeInTheDocument();
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
  });

  it("should handle cancel button", async () => {
    const user = userEvent.setup();
    render(<CreatePropertyDialog onPropertyCreated={mockOnPropertyCreated} />);

    // Open the dialog
    const triggerButton = screen.getByText("Create Property");
    await user.click(triggerButton);

    await waitFor(() => {
      const cancelButton = screen.getByText("Cancel");
      expect(cancelButton).toBeInTheDocument();
    });

    const cancelButton = screen.getByText("Cancel");
    await user.click(cancelButton);

    // Dialog should be closed
    expect(screen.queryByText("Add a new hosting property to the system.")).not.toBeInTheDocument();
  });
});