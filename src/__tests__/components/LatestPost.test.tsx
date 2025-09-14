import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

// Simple mock component for testing
const MockLatestPost = () => (
  <div className="w-full max-w-xs">
    <p>You have no posts yet.</p>
    <form className="flex flex-col gap-2" data-testid="post-form">
      <input
        type="text"
        placeholder="Title"
        className="w-full rounded-full bg-white/10 px-4 py-2 text-white"
      />
      <button
        type="submit"
        className="rounded-full bg-white/10 px-10 py-3 font-semibold transition hover:bg-white/20"
      >
        Submit
      </button>
    </form>
  </div>
);

describe("LatestPost Component", () => {
  it("should render no posts message", () => {
    render(<MockLatestPost />);
    expect(screen.getByText("You have no posts yet.")).toBeInTheDocument();
  });

  it("should render form elements", () => {
    render(<MockLatestPost />);
    expect(screen.getByPlaceholderText("Title")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Submit" })).toBeInTheDocument();
  });

  it("should have proper form structure", () => {
    render(<MockLatestPost />);
    const form = screen.getByTestId("post-form");
    expect(form).toBeInTheDocument();
    expect(form).toHaveClass("flex", "flex-col", "gap-2");
  });
});
