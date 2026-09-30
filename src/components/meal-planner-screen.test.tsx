import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MealPlannerScreen } from "./meal-planner-screen";
vi.mock("@/lib/meal-api",()=>({mealApi:{week:vi.fn().mockResolvedValue(null),createPlan:vi.fn(),createMeal:vi.fn(),updateMeal:vi.fn(),deleteMeal:vi.fn()},MealApiError:class extends Error{}}));
describe("MealPlannerScreen",()=>{it("renders all daily meal slots",async()=>{render(<MealPlannerScreen householdId="20000000-0000-4000-8000-000000000001"/>);expect(await screen.findByText("Meals")).toBeInTheDocument();expect((await screen.findAllByText("BREAKFAST")).length).toBe(7);expect((await screen.findAllByText("DINNER")).length).toBe(7)})});
