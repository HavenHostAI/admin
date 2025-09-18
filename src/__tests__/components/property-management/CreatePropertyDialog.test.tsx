import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CreatePropertyDialog } from "@/components/property-management/CreatePropertyDialog";
import type { Mock } from "vitest";

type TrpcReactModule = typeof import("~/trpc/react");
type PropertyCreateMutationHook =
  TrpcReactModule["api"]["property"]["create"]["useMutation"];
type PropertyCreateMutationResult = ReturnType<PropertyCreateMutationHook>;

// Mock tRPC
const mockOnPropertyCreated = vi.fn();
let mockMutate: ReturnType<typeof vi.fn>;
let createUseMutationMock: Mock<
  Parameters<PropertyCreateMutationHook>,
  PropertyCreateMutationResult
>;

vi.mock("~/trpc/react", () => ({
  api: {
    property: {
      create: {
        useMutation: vi.fn(() => ({
          mutate: vi.fn(),
          isPending: false,
          error: null,
        })),
      },
    },
  },
}));

describe("CreatePropertyDialog", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockMutate = vi.fn();

    const { api } = await import("~/trpc/react");
    createUseMutationMock = vi.mocked(api.property.create.useMutation);

    createUseMutationMock.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      error: null,
    } as PropertyCreateMutationResult);
  });

  it("should render create property dialog trigger", () => {
    render(<CreatePropertyDialog onPropertyCreated={mockOnPropertyCreated} />);

    expect(screen.getByText("Create Property")).toBeInTheDocument();
  });

  const openDialog = async (user = userEvent.setup()) => {
    render(<CreatePropertyDialog onPropertyCreated={mockOnPropertyCreated} />);

    const triggerButton = screen.getByText("Create Property");
    await user.click(triggerButton);

    await screen.findByText("Add a new hosting property to the system.");

    return { user };
  };

  it("should show form fields when dialog is opened", async () => {
    const { user } = await openDialog();

    expect(screen.getByLabelText("Name *")).toBeInTheDocument();
    expect(screen.getByLabelText("Type *")).toBeInTheDocument();
    expect(screen.getByLabelText("Status")).toBeInTheDocument();
    expect(screen.getByLabelText("Description")).toBeInTheDocument();
    expect(screen.getByLabelText("Owner ID")).toBeInTheDocument();
  });

  it("should have correct default values when dialog is opened", async () => {
    await openDialog();

    expect(screen.getByLabelText("Status")).toHaveTextContent("Active");
  });

  it("should handle form input changes", async () => {
    const { user } = await openDialog();

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
    const { user } = await openDialog();

    // Fill out the form
    const nameInput = screen.getByLabelText("Name *");
    const descriptionTextarea = screen.getByLabelText("Description");
    const ownerIdInput = screen.getByLabelText("Owner ID");
    const typeTrigger = screen.getByLabelText("Type *");

    await user.type(nameInput, "Test Server");
    await user.type(descriptionTextarea, "A test server");
    await user.type(ownerIdInput, "user_123");
    await user.click(typeTrigger);
    await user.click(await screen.findByRole("option", { name: "Server" }));

    // Submit the form - use the submit button specifically
    const submitButtons = screen.getAllByText("Create Property");
    const submitButton = submitButtons.find(
      (button) => button.getAttribute("type") === "submit",
    );
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
    });
  });

  it("should show error message when mutation fails", async () => {
    createUseMutationMock.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      error: { message: "Failed to create property" },
    });

    await openDialog();

    expect(screen.getByText("Failed to create property")).toBeInTheDocument();
  });

  it("should show loading state during submission", async () => {
    createUseMutationMock.mockReturnValue({
      mutate: mockMutate,
      isPending: true,
      error: null,
    });

    await openDialog();

    expect(screen.getByText("Creating...")).toBeInTheDocument();
  });

  it("should handle cancel button", async () => {
    const { user } = await openDialog();

    const cancelButton = screen.getByText("Cancel");
    await user.click(cancelButton);

    // Dialog should be closed
    expect(
      screen.queryByText("Add a new hosting property to the system."),
    ).not.toBeInTheDocument();
  });
});
