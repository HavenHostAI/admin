import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { SignUpForm } from "~/components/auth/SignUpForm";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock tRPC
vi.mock("~/trpc/react", () => ({
  api: {
    user: {
      create: {
        useMutation: () => ({
          mutateAsync: vi.fn(),
          isPending: false,
        }),
      },
    },
  },
}));

describe("SignUpForm", () => {
  it("should have proper autocomplete attributes on form inputs", () => {
    render(<SignUpForm />);

    // Check name input has autocomplete="name"
    const nameInput = screen.getByLabelText("Full Name");
    expect(nameInput).toHaveAttribute("autocomplete", "name");

    // Check email input has autocomplete="email"
    const emailInput = screen.getByLabelText("Email");
    expect(emailInput).toHaveAttribute("autocomplete", "email");

    // Check password input has autocomplete="new-password"
    const passwordInput = screen.getByLabelText("Password");
    expect(passwordInput).toHaveAttribute("autocomplete", "new-password");

    // Check confirm password input has autocomplete="new-password"
    const confirmPasswordInput = screen.getByLabelText("Confirm Password");
    expect(confirmPasswordInput).toHaveAttribute(
      "autocomplete",
      "new-password",
    );
  });

  it("should have proper input types", () => {
    render(<SignUpForm />);

    const nameInput = screen.getByLabelText("Full Name");
    expect(nameInput).toHaveAttribute("type", "text");

    const emailInput = screen.getByLabelText("Email");
    expect(emailInput).toHaveAttribute("type", "email");

    const passwordInput = screen.getByLabelText("Password");
    expect(passwordInput).toHaveAttribute("type", "password");

    const confirmPasswordInput = screen.getByLabelText("Confirm Password");
    expect(confirmPasswordInput).toHaveAttribute("type", "password");
  });

  it("should have required attributes on inputs", () => {
    render(<SignUpForm />);

    const nameInput = screen.getByLabelText("Full Name");
    expect(nameInput).toBeRequired();

    const emailInput = screen.getByLabelText("Email");
    expect(emailInput).toBeRequired();

    const passwordInput = screen.getByLabelText("Password");
    expect(passwordInput).toBeRequired();

    const confirmPasswordInput = screen.getByLabelText("Confirm Password");
    expect(confirmPasswordInput).toBeRequired();
  });

  it("should have minimum length on password input", () => {
    render(<SignUpForm />);

    const passwordInput = screen.getByLabelText("Password");
    expect(passwordInput).toHaveAttribute("minlength", "8");
  });

  it("should render sign up form elements", () => {
    render(<SignUpForm />);

    expect(
      screen.getByText("Enter your information to create a new account."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Create Account" }),
    ).toBeInTheDocument();
  });
});
