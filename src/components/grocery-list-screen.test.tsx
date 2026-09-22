import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { GroceryListScreen } from "./grocery-list-screen";

const list = {
  id: "g1",
  name: "Current List",
  status: "ACTIVE" as const,
  version: 1,
  items: [
    { id: "1", name: "Bananas", checked: false, version: 1 },
    { id: "2", name: "Milk", checked: true, version: 2 }
  ]
};

describe("GroceryListScreen", () => {
  it("shows progress and creates an item", async () => {
    const user = userEvent.setup();
    const createItem = vi.fn().mockResolvedValue(undefined);
    render(<GroceryListScreen list={list} actions={{ createItem, updateItem: vi.fn(), deleteItem: vi.fn(), refresh: vi.fn(), completeList: vi.fn() }} />);
    expect(screen.getByText("50%")).toBeInTheDocument();
    await user.type(screen.getByPlaceholderText("Add grocery item"), "Apples");
    await user.click(screen.getByRole("button", { name: "Add grocery item" }));
    expect(createItem).toHaveBeenCalledWith("Apples");
  });
});
