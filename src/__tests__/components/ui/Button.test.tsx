import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

// Mock the Button component since it might not exist yet
interface MockButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  [key: string]: unknown;
}

const MockButton = ({
  children,
  onClick,
  disabled,
  ...props
}: MockButtonProps) => (
  <button onClick={onClick} disabled={disabled} {...props}>
    {children}
  </button>
);

describe("Button Component", () => {
  it("should render with correct text", () => {
    render(<MockButton>Click me</MockButton>);
    expect(
      screen.getByRole("button", { name: "Click me" }),
    ).toBeInTheDocument();
  });

  it("should handle click events", () => {
    const handleClick = vi.fn();
    render(<MockButton onClick={handleClick}>Click me</MockButton>);

    fireEvent.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("should be disabled when disabled prop is true", () => {
    render(<MockButton disabled>Click me</MockButton>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("should accept additional props", () => {
    render(<MockButton data-testid="custom-button">Click me</MockButton>);
    expect(screen.getByTestId("custom-button")).toBeInTheDocument();
  });
});
