import { test, expect } from "@playwright/test";
test("meal planner supports creating and editing a meal", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Meals" }).click();
  await expect(page.getByRole("heading", { name: "Meals" })).toBeVisible();
  await page.getByRole("button", { name: "Add meal" }).first().click();
  await page.getByLabel("Meal name").fill("Oatmeal");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Oatmeal")).toBeVisible();
});
