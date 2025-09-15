import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { LogoutButton } from "@/components/auth/LogoutButton";

// Mock tRPC
vi.mock("~/trpc/react", () => ({
  api: {
    auth: {
      logout: {
        useMutation: vi.fn(),
      },
    },
  },
}));

describe("LogoutButton", () => {
  const user = userEvent.setup();
  let mockMutate: any;
  let mockUseMutation: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    const { api } = await import("~/trpc/react");
    mockUseMutation = vi.mocked(api.auth.logout.useMutation);
    mockMutate = vi.fn();
    
    mockUseMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      error: null,
    });
  });

  it("should render logout button with default text", () => {
    render(<LogoutButton />);

    expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();
  });

  it("should call logout mutation when clicked", async () => {
    render(<LogoutButton />);

    const button = screen.getByRole("button", { name: "Sign out" });
    await user.click(button);

    expect(mockMutate).toHaveBeenCalled();
  });

  it("should show loading state when pending", () => {
    mockUseMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: true,
      error: null,
    });

    render(<LogoutButton />);

    expect(screen.getByRole("button", { name: "Signing out..." })).toBeInTheDocument();
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("should use custom className when provided", () => {
    const customClassName = "custom-button-class";
    render(<LogoutButton className={customClassName} />);

    const button = screen.getByRole("button");
    expect(button).toHaveClass(customClassName);
  });

  it("should call onSuccess callback on successful logout", async () => {
    const onSuccess = vi.fn();
    mockUseMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      error: null,
    });

    render(<LogoutButton onSuccess={onSuccess} />);

    // Simulate successful logout by calling the onSuccess from the mutation
    const mutationConfig = mockUseMutation.mock.calls[0][0];
    mutationConfig.onSuccess();

    expect(onSuccess).toHaveBeenCalled();
  });

  it("should call onError callback on logout failure", async () => {
    const onError = vi.fn();
    const errorMessage = "Logout failed";
    mockUseMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      error: { message: errorMessage },
    });

    render(<LogoutButton onError={onError} />);

    // Simulate error by calling the onError from the mutation
    const mutationConfig = mockUseMutation.mock.calls[0][0];
    mutationConfig.onError({ message: errorMessage });

    expect(onError).toHaveBeenCalledWith(errorMessage);
  });
});
