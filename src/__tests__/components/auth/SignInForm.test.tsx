import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { SignInForm } from "~/components/auth/SignInForm";

// Mock next-auth
vi.mock("next-auth/react", () => ({
  signIn: vi.fn(),
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

describe("SignInForm", () => {
  it("should have proper autocomplete attributes on form inputs", () => {
    render(<SignInForm />);

    // Check email input has autocomplete="email"
    const emailInput = screen.getByLabelText("Email");
    expect(emailInput).toHaveAttribute("autocomplete", "email");

    // Check password input has autocomplete="current-password"
    const passwordInput = screen.getByLabelText("Password");
    expect(passwordInput).toHaveAttribute("autocomplete", "current-password");
  });

  it("should have proper input types", () => {
    render(<SignInForm />);

    const emailInput = screen.getByLabelText("Email");
    expect(emailInput).toHaveAttribute("type", "email");

    const passwordInput = screen.getByLabelText("Password");
    expect(passwordInput).toHaveAttribute("type", "password");
  });

  it("should have required attributes on inputs", () => {
    render(<SignInForm />);

    const emailInput = screen.getByLabelText("Email");
    expect(emailInput).toBeRequired();

    const passwordInput = screen.getByLabelText("Password");
    expect(passwordInput).toBeRequired();
  });

  it("should render sign in form elements", () => {
    render(<SignInForm />);

    expect(
      screen.getByText(
        "Enter your email and password to sign in to your account.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign In" })).toBeInTheDocument();
  });
});
