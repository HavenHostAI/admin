import "../../../tests/setup";
import { render, renderHook, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import {
  useCreateSuggestionContext,
  useSupportCreateSuggestion,
} from "@/hooks/useSupportCreateSuggestion";

vi.mock("ra-core", () => ({
  useTranslate: () => (key: string, options?: { _: string }) =>
    options?._ ?? key,
}));

describe("useSupportCreateSuggestion", () => {
  it("calls the provided onCreate handler when the create option is selected", async () => {
    const handleChange = vi.fn();
    const onCreate = vi
      .fn()
      .mockResolvedValue({ id: "new", name: "New option" });

    const { result } = renderHook(() =>
      useSupportCreateSuggestion({
        handleChange,
        onCreate,
      }),
    );

    await result.current.handleChange({
      target: { value: { id: "@@ra-create" } },
    });

    expect(onCreate).toHaveBeenCalledWith(undefined);
    expect(handleChange).toHaveBeenCalledWith({
      id: "new",
      name: "New option",
    });
  });

  it("renders the creation form and submits new values", async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();

    const CreateForm = () => {
      const { filter, onCreate, onCancel } = useCreateSuggestionContext();
      return (
        <div>
          <span data-testid="filter-value">{filter}</span>
          <button onClick={() => onCreate({ id: "created", name: filter })}>
            Save
          </button>
          <button onClick={onCancel}>Cancel</button>
        </div>
      );
    };

    const Wrapper = () => {
      const support = useSupportCreateSuggestion({
        create: <CreateForm />,
        filter: "Alpha",
        handleChange,
      });

      return (
        <div>
          <button
            onClick={() =>
              support.handleChange({ target: { value: { id: "@@ra-create" } } })
            }
          >
            Add new
          </button>
          <div data-testid="create-portal">{support.createElement}</div>
        </div>
      );
    };

    render(<Wrapper />);

    await user.click(screen.getByRole("button", { name: /add new/i }));

    await waitFor(() =>
      expect(screen.getByTestId("create-portal")).toContainElement(
        screen.getByTestId("filter-value"),
      ),
    );
    expect(screen.getByTestId("filter-value").textContent).toBe("Alpha");

    await user.click(screen.getByRole("button", { name: /save/i }));
    expect(handleChange).toHaveBeenCalledWith({ id: "created", name: "Alpha" });

    await waitFor(() =>
      expect(
        screen
          .getByTestId("create-portal")
          .contains(screen.queryByRole("button", { name: /save/i })),
      ).toBe(false),
    );
  });
});
