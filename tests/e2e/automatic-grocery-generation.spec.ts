import { test, expect } from "@playwright/test";
test("generates grocery items from the linked meal plan",async({page})=>{await page.goto("/");await page.getByRole("button",{name:"Meals"}).click();await page.getByRole("button",{name:"Generate Grocery List"}).click();await expect(page.getByRole("heading",{name:"Grocery List Generated"})).toBeVisible()});
