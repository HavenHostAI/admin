import React from "react";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { LoginForm } from "@/components/auth/LoginForm";

// Mock tRPC
vi.mock("~/trpc/react", () => ({
  api: {
    auth: {
      login: {
        useMutation: vi.fn(),
      },
    },
  },
}));

describe("LoginForm", () => {
  const user = userEvent.setup();
  let mockMutate: ReturnType<typeof vi.fn>;
  let mockUseMutation: ReturnType<typeof vi.mocked>;

  beforeEach(async () => {
    vi.clearAllMocks();

    const { api } = await import("~/trpc/react");
    mockUseMutation = vi.mocked(api.auth.login.useMutation);
    mockMutate = vi.fn();

    mockUseMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      error: null,
    });
  });

  it("should render login form with email and password fields", () => {
    render(<LoginForm />);

    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
  });

  it("should update form data when user types", async () => {
    render(<LoginForm />);

    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "password123");

    expect(emailInput).toHaveValue("test@example.com");
    expect(passwordInput).toHaveValue("password123");
  });

  it("should call login mutation on form submit", async () => {
    render(<LoginForm />);

    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");
    const submitButton = screen.getByRole("button", { name: "Sign in" });

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "password123");
    await user.click(submitButton);

    expect(mockMutate).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "password123",
    });
  });

  it("should show loading state when pending", () => {
    mockUseMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: true,
      error: null,
    });

    render(<LoginForm />);

    expect(
      screen.getByRole("button", { name: "Signing in..." }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("should display error message when login fails", () => {
    const errorMessage = "Invalid email or password";
    mockUseMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      error: { message: errorMessage },
    });

    render(<LoginForm />);

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it("should call onSuccess callback on successful login", async () => {
    const onSuccess = vi.fn();
    mockUseMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      error: null,
    });

    render(<LoginForm onSuccess={onSuccess} />);

    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");
    const submitButton = screen.getByRole("button", { name: "Sign in" });

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "password123");
    await user.click(submitButton);

    // Simulate successful login by calling the onSuccess from the mutation
    const mutationConfig = mockUseMutation.mock.calls[0][0];
    mutationConfig.onSuccess();

    expect(onSuccess).toHaveBeenCalled();
  });

  it("should call onError callback on login failure", async () => {
    const onError = vi.fn();
    const errorMessage = "Login failed";
    mockUseMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      error: { message: errorMessage },
    });

    render(<LoginForm onError={onError} />);

    // Simulate error by calling the onError from the mutation
    const mutationConfig = mockUseMutation.mock.calls[0][0];
    mutationConfig.onError({ message: errorMessage });

    expect(onError).toHaveBeenCalledWith(errorMessage);
  });

  it("should clear form after successful login", async () => {
    mockUseMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      error: null,
    });

    render(<LoginForm />);

    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "password123");

    // Simulate successful login
    const mutationConfig = mockUseMutation.mock.calls[0][0];

    await act(async () => {
      mutationConfig.onSuccess();
    });

    expect(emailInput).toHaveValue("");
    expect(passwordInput).toHaveValue("");
  });
});
