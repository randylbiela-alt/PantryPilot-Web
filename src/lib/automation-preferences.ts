export type AutomationPreferences = {
  autoGenerateAfterMealChange: boolean;
};

const defaults: AutomationPreferences = {
  autoGenerateAfterMealChange: false
};

function key(householdId: string) {
  return `pantrypilot.automation.${householdId}`;
}

export function loadAutomationPreferences(householdId: string): AutomationPreferences {
  if (typeof window === "undefined") return defaults;
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem(key(householdId)) ?? "{}") };
  } catch {
    return defaults;
  }
}

export function saveAutomationPreferences(householdId: string, preferences: AutomationPreferences) {
  localStorage.setItem(key(householdId), JSON.stringify(preferences));
}
