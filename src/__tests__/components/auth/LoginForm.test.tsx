import React from "react";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { MockedFunction } from "vitest";
import { LoginForm } from "@/components/auth/LoginForm";

type TrpcReactModule = typeof import("~/trpc/react");
type LoginMutationHook = TrpcReactModule["api"]["auth"]["login"]["useMutation"];
type LoginMutationResult = ReturnType<LoginMutationHook>;

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

const buildMutationResult = (
  mockMutate: ReturnType<typeof vi.fn>,
  overrides: Partial<LoginMutationResult> = {},
): LoginMutationResult =>
  ({
    mutate: mockMutate,
    isPending: false,
    error: null,
    ...overrides,
  }) as unknown as LoginMutationResult;

describe("LoginForm", () => {
  const user = userEvent.setup();
  let mockMutate: ReturnType<typeof vi.fn>;
  let mockUseMutation: MockedFunction<LoginMutationHook>;

  beforeEach(async () => {
    vi.clearAllMocks();

    const { api } = await import("~/trpc/react");
    mockUseMutation = vi.mocked(api.auth.login.useMutation);
    mockMutate = vi.fn();

    mockUseMutation.mockReturnValue(buildMutationResult(mockMutate));
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
    mockUseMutation.mockReturnValue(
      buildMutationResult(mockMutate, { isPending: true }),
    );

    render(<LoginForm />);

    expect(
      screen.getByRole("button", { name: "Signing in..." }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("should display error message when login fails", () => {
    const errorMessage = "Invalid email or password";
    mockUseMutation.mockReturnValue(
      buildMutationResult(mockMutate, {
        error: {
          message: errorMessage,
        } as unknown as LoginMutationResult["error"],
      }),
    );

    render(<LoginForm />);

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it("should call onSuccess callback on successful login", async () => {
    const onSuccess = vi.fn();
    mockUseMutation.mockReturnValue(buildMutationResult(mockMutate));

    render(<LoginForm onSuccess={onSuccess} />);

    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");
    const submitButton = screen.getByRole("button", { name: "Sign in" });

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "password123");
    await user.click(submitButton);

    // Simulate successful login by calling the onSuccess from the mutation
    const mutationConfig = mockUseMutation.mock.calls[0]?.[0] as {
      onSuccess?: (...args: unknown[]) => void;
      onError?: (...args: unknown[]) => void;
    };

    await act(async () => {
      mutationConfig?.onSuccess?.();
    });

    expect(onSuccess).toHaveBeenCalled();
  });

  it("should call onError callback on login failure", async () => {
    const onError = vi.fn();
    const errorMessage = "Login failed";
    mockUseMutation.mockReturnValue(
      buildMutationResult(mockMutate, {
        error: {
          message: errorMessage,
        } as unknown as LoginMutationResult["error"],
      }),
    );

    render(<LoginForm onError={onError} />);

    // Simulate error by calling the onError from the mutation
    const mutationConfig = mockUseMutation.mock.calls[0]?.[0] as {
      onSuccess?: (...args: unknown[]) => void;
      onError?: (...args: unknown[]) => void;
    };
    mutationConfig?.onError?.({ message: errorMessage });

    expect(onError).toHaveBeenCalledWith(errorMessage);
  });

  it("should clear form after successful login", async () => {
    mockUseMutation.mockReturnValue(buildMutationResult(mockMutate));

    render(<LoginForm />);

    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "password123");

    // Simulate successful login
    const mutationConfig = mockUseMutation.mock.calls[0]?.[0] as {
      onSuccess?: (...args: unknown[]) => void;
      onError?: (...args: unknown[]) => void;
    };

    await act(async () => {
      mutationConfig?.onSuccess?.();
    });

    expect(emailInput).toHaveValue("");
    expect(passwordInput).toHaveValue("");
  });
});
