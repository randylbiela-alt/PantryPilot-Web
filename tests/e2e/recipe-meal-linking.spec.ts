import { test, expect } from "@playwright/test";
test("opens recipe selection from a meal slot",async({page})=>{await page.goto("/");await page.getByRole("button",{name:"Meals"}).click();await page.getByText("+ Select recipe").first().click();await expect(page.getByRole("heading",{name:"Select Recipe"})).toBeVisible()});
