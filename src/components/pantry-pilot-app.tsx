"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ClipboardList,
  LogOut,
  Pencil,
  Plus,
  Search,
  ShoppingBasket,
  Trash2,
  UserRound,
  Wheat
} from "lucide-react";
import { api, ApiError } from "@/lib/api";
import type {
  Bootstrap,
  CreatePantryInput,
  GroceryItem,
  PantryItem
} from "@/lib/types";
import type {
  HouseholdSettings,
  ProfileSettings
} from "@/lib/onboarding-types";
import { publicEnv } from "@/lib/env";
import { Button, Input } from "./ui";
import { ErrorState, InlineAlert, Loading } from "./status";
import { PantryDialog } from "./pantry-dialog";
import { DeleteDialog } from "./delete-dialog";
import { GroceryListScreen } from "./grocery-list-screen";
import { MealPlannerScreen } from "./meal-planner-screen";
import { RecipeListScreen } from "./recipe-list-screen";
import { IntelligenceScreen } from "./intelligence-screen";
import { AnalyticsInsightsScreen } from "./analytics-insights-screen";
import { MonitoringScreen } from "./monitoring-screen";
import { ForecastingScreen } from "./forecasting-screen";
import { InventoryHistoryScreen } from "./inventory-history-screen";
import { ConsumptionAnalyticsScreen } from "./consumption-analytics-screen";
import { ResponsiveNavigation, type PantryPilotTab } from "./responsive-navigation";
import { OnboardingWizard } from "./onboarding-wizard";
import { ProfileScreen } from "./profile-screen";
import { NotificationCenter } from "./notification-center";

export function PantryPilotApp() {
  const [status, setStatus] = useState<
    "loading" | "ready" | "error" | "signedout"
  >("loading");
  const [data, setData] = useState<Bootstrap | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [notice, setNotice] = useState<{
    message: string;
    correlationId?: string;
  } | null>(null);
  const [query, setQuery] = useState("");
  const [dialog, setDialog] = useState<{
    mode: "create" | "edit";
    item?: PantryItem;
  } | null>(null);
  const [deleting, setDeleting] = useState<PantryItem | null>(null);
  const [busyDelete, setBusyDelete] = useState(false);
  const [tab, setTab] = useState<
    PantryPilotTab
  >("pantry");
  const [profileSettings, setProfileSettings] =
    useState<ProfileSettings | null>(null);
  const [householdSettings, setHouseholdSettings] =
    useState<HouseholdSettings | null>(null);

  const load = useCallback(async () => {
    setStatus("loading");
    setError(null);

    try {
      let session = await api.session();

      if (
        !session.user &&
        publicEnv.allowDevAuth &&
        publicEnv.deployment !== "production"
      ) {
        await api.devSession();
        session = await api.session();
      }

      if (!session.user) {
        setStatus("error");
        setError(
          new ApiError(
            401,
            "AUTHENTICATION_REQUIRED",
            "Authentication is required."
          )
        );
        return;
      }

      setData(await api.bootstrap());
      setStatus("ready");
    } catch (caught) {
      setError(caught);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

  const householdId = data?.activeHouseholdId;
  const filtered = useMemo(
    () =>
      data?.pantry.filter(item =>
        item.name.toLowerCase().includes(query.toLowerCase())
      ) ?? [],
    [data, query]
  );

  async function refreshPantry() {
    if (!householdId) return;
    const pantry = await api.listPantry(householdId);
    setData(current => (current ? { ...current, pantry } : current));
  }

  async function save(input: CreatePantryInput) {
    if (!householdId) throw new Error("No active household.");

    try {
      if (dialog?.mode === "edit" && dialog.item) {
        const updated = await api.updatePantry(
          householdId,
          dialog.item.id,
          { ...input, version: dialog.item.version }
        );
        setData(current =>
          current
            ? {
                ...current,
                pantry: current.pantry.map(item =>
                  item.id === updated.id ? updated : item
                )
              }
            : current
        );
      } else {
        const created = await api.createPantry(householdId, input);
        setData(current =>
          current
            ? { ...current, pantry: [...current.pantry, created] }
            : current
        );
      }
      setDialog(null);
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 409) {
        await refreshPantry();
        setDialog(null);
        setNotice({
          message:
            "This item changed in another session. PantryPilot refreshed the latest server version.",
          correlationId: caught.correlationId
        });
        return;
      }
      throw caught;
    }
  }

  async function remove() {
    if (!householdId || !deleting) return;
    setBusyDelete(true);

    try {
      await api.deletePantry(householdId, deleting.id, deleting.version);
      setData(current =>
        current
          ? {
              ...current,
              pantry: current.pantry.filter(item => item.id !== deleting.id)
            }
          : current
      );
      setDeleting(null);
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 409) {
        await refreshPantry();
        setDeleting(null);
        setNotice({
          message:
            "This item changed before deletion. PantryPilot refreshed the latest server version.",
          correlationId: caught.correlationId
        });
      } else {
        setNotice({
          message:
            caught instanceof Error ? caught.message : "Unable to delete item.",
          correlationId:
            caught instanceof ApiError ? caught.correlationId : undefined
        });
      }
    } finally {
      setBusyDelete(false);
    }
  }

  async function refreshGrocery() {
    if (!householdId) return;
    const lists = await api.listGroceryLists(householdId);
    const current =
      lists.find(list => list.status === "ACTIVE") ?? lists[0];

    if (current) {
      setData(value =>
        value ? { ...value, groceryList: current } : value
      );
    }
  }

  async function createGroceryItem(name: string) {
    if (!householdId || !data?.groceryList.id) {
      throw new Error("No active grocery list.");
    }

    const created = await api.createGroceryItem(
      householdId,
      data.groceryList.id,
      { name }
    );

    setData(current =>
      current
        ? {
            ...current,
            groceryList: {
              ...current.groceryList,
              items: [...current.groceryList.items, created]
            }
          }
        : current
    );
  }

  async function updateGroceryItem(
    item: GroceryItem,
    input: { name?: string; checked?: boolean }
  ) {
    if (!householdId || !data?.groceryList.id) {
      throw new Error("No active grocery list.");
    }

    const updated = await api.updateGroceryItem(
      householdId,
      data.groceryList.id,
      item.id,
      { ...input, version: item.version }
    );

    setData(current =>
      current
        ? {
            ...current,
            groceryList: {
              ...current.groceryList,
              items: current.groceryList.items.map(existing =>
                existing.id === updated.id ? updated : existing
              )
            }
          }
        : current
    );
  }

  async function deleteGroceryItem(item: GroceryItem) {
    if (!householdId || !data?.groceryList.id) {
      throw new Error("No active grocery list.");
    }

    await api.deleteGroceryItem(
      householdId,
      data.groceryList.id,
      item.id,
      item.version
    );

    setData(current =>
      current
        ? {
            ...current,
            groceryList: {
              ...current.groceryList,
              items: current.groceryList.items.filter(
                existing => existing.id !== item.id
              )
            }
          }
        : current
    );
  }

  async function completeGroceryList() {
    if (
      !householdId ||
      !data?.groceryList.id ||
      data.groceryList.version === undefined
    ) {
      throw new Error("No active grocery list.");
    }

    await api.updateGroceryList(
      householdId,
      data.groceryList.id,
      {
        status: "COMPLETED",
        version: data.groceryList.version
      }
    );

    /*
     * Bootstrap owns automatic active-list creation. Reloading bootstrap
     * immediately replaces the completed list with the new Current List.
     */
    const refreshed = await api.bootstrap();
    setData(refreshed);
    setNotice({
      message: "Shopping trip completed. A new Current List is ready."
    });
  }

  async function loadProfile() {
    if (!householdId) return;

    const [profile, household] = await Promise.all([
      api.profile(),
      api.household(householdId)
    ]);

    setProfileSettings(profile);
    setHouseholdSettings(household);
  }

  async function signOut() {
    try {
      await api.signOut();
    } finally {
      setData(null);
      setStatus("signedout");
    }
  }

  if (status === "loading") {
    return (
      <Shell>
        <Loading label="Loading PantryPilot" />
      </Shell>
    );
  }

  if (status === "error") {
    return (
      <Shell>
        <ErrorState error={error} retry={load} />
      </Shell>
    );
  }

  if (status === "signedout") {
    return (
      <Shell>
        <div className="mx-auto max-w-md rounded-3xl border bg-white p-6 text-center">
          <h1 className="text-2xl font-black">Signed out</h1>
          <Button onClick={load} className="mt-4">
            Sign in locally
          </Button>
        </div>
      </Shell>
    );
  }

  if (!data) return null;

  if (data.onboardingRequired || !data.activeHouseholdId) {
    return (
      <Shell>
        <OnboardingWizard
          onComplete={async input => {
            await api.createHousehold(input);
            await load();
          }}
        />
      </Shell>
    );
  }

  return (
    <Shell>
      <ResponsiveNavigation active={tab} onSelect={nextTab => {
        setTab(nextTab);
        if (nextTab === "profile") void loadProfile();
      }} />

      {notice && (
        <div className="mb-4">
          <InlineAlert
            message={notice.message}
            correlationId={notice.correlationId}
            onDismiss={() => setNotice(null)}
          />
        </div>
      )}

      {tab === "grocery" ? (
        <GroceryListScreen
          list={data.groceryList}
          actions={{
            createItem: createGroceryItem,
            updateItem: updateGroceryItem,
            deleteItem: deleteGroceryItem,
            refresh: refreshGrocery,
            completeList: completeGroceryList
          }}
        />
      ) : tab === "meals" ? (
        <MealPlannerScreen householdId={data.activeHouseholdId} />
      ) : tab === "recipes" ? (
        <RecipeListScreen householdId={data.activeHouseholdId} />
      ) : tab === "intelligence" ? (
        <IntelligenceScreen householdId={data.activeHouseholdId} />
      ) : tab === "analytics" ? (
        <AnalyticsInsightsScreen householdId={data.activeHouseholdId} pantry={data.pantry} groceryList={data.groceryList} />
      ) : tab === "consumption" ? (
        <ConsumptionAnalyticsScreen householdId={data.activeHouseholdId} />
      ) : tab === "monitoring" ? (
        <MonitoringScreen />
      ) : tab === "forecasting" ? (
        <ForecastingScreen householdId={data.activeHouseholdId} />
      ) : tab === "history" ? (
        <InventoryHistoryScreen householdId={data.activeHouseholdId} pantry={data.pantry} onChanged={refreshPantry} />
      ) : tab === "profile" ? (
        profileSettings && householdSettings ? (
          <ProfileScreen
            profile={profileSettings}
            household={householdSettings}
            onSignOutAllDevices={async () => {
              await api.signOutAll();
              setData(null);
              setStatus("signedout");
            }}
            onSave={async values => {
              const updatedHousehold = await api.updateHousehold(
                data.activeHouseholdId!,
                {
                  name: values.name,
                  timeZone: values.timeZone,
                  version: values.householdVersion
                }
              );

              const updatedProfile = await api.updateProfile({
                householdSize: values.householdSize,
                weeklyBudget: values.weeklyBudget,
                dietaryPreference: values.dietaryPreference,
                timeZone: values.timeZone,
                version: values.profileVersion
              });

              setHouseholdSettings(updatedHousehold);
              setProfileSettings(updatedProfile);
              setData(current =>
                current
                  ? {
                      ...current,
                      profile: {
                        ...current.profile!,
                        householdSizeDefault:
                          updatedProfile.householdSizeDefault,
                        weeklyBudget: updatedProfile.weeklyBudget,
                        defaultDiet: updatedProfile.defaultDiet,
                        onboardingComplete:
                          updatedProfile.onboardingComplete
                      },
                      households: current.households.map(household =>
                        household.id === updatedHousehold.id
                          ? { ...household, name: updatedHousehold.name }
                          : household
                      )
                    }
                  : current
              );
            }}
          />
        ) : (
          <Loading label="Loading profile" />
        )
      ) : (
        <>
          <header className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[.18em] text-[#486957]">
                {data.households[0]?.name ?? "PantryPilot"}
              </p>
              <h1 className="mt-1 text-4xl font-black">Your pantry</h1>
              <p className="mt-2 text-sm text-[#6d7d74]">
                Server-synced inventory ·{" "}
                {data.user.displayName ?? data.user.email}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <NotificationCenter householdId={data.activeHouseholdId} pantry={data.pantry} />
              <button
              aria-label="Sign out"
              onClick={signOut}
              className="rounded-xl border bg-white p-3"
            >
              <LogOut size={18} />
            </button>
            </div>
          </header>

          <div className="mt-5 flex gap-2">
            <label className="relative flex-1">
              <span className="sr-only">Search pantry</span>
              <Search
                className="absolute left-3 top-3 text-[#6d7d74]"
                size={18}
              />
              <Input
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder="Search pantry"
                className="pl-10"
              />
            </label>
            <Button
              onClick={() => setDialog({ mode: "create" })}
              aria-label="Add pantry item"
            >
              <Plus size={18} />
            </Button>
          </div>

          <main className="mt-5">
            {filtered.length === 0 ? (
              <div className="rounded-3xl border bg-white p-8 text-center">
                <Wheat className="mx-auto text-[#486957]" size={38} />
                <h2 className="mt-3 text-xl font-black">
                  {data.pantry.length
                    ? "No matching items"
                    : "Your pantry is empty"}
                </h2>
              </div>
            ) : (
              <ul className="space-y-3" aria-label="Pantry items">
                {filtered.map(item => (
                  <li
                    key={item.id}
                    className="flex items-center gap-3 rounded-3xl border bg-white p-4 shadow-sm"
                  >
                    <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#edf5db]">
                      <Wheat size={20} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate font-black">{item.name}</h2>
                      <p className="text-sm text-[#6d7d74]">
                        {String(item.quantity)} {item.unit}
                        {item.category ? `· ${item.category}` : ""}
                      </p>
                      <p className="text-xs text-[#84918a]">
                        Version {item.version}
                      </p>
                    </div>
                    <button
                      aria-label={`Edit ${item.name}`}
                      onClick={() =>
                        setDialog({ mode: "edit", item })
                      }
                      className="rounded-xl border p-2"
                    >
                      <Pencil size={17} />
                    </button>
                    <button
                      aria-label={`Delete ${item.name}`}
                      onClick={() => setDeleting(item)}
                      className="rounded-xl border p-2 text-[#9a4f36]"
                    >
                      <Trash2 size={17} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </main>
        </>
      )}

      <footer className="mt-6 text-center text-xs text-[#7c8982]">
        API {publicEnv.apiBaseUrl} · App {publicEnv.appVersion}
      </footer>

      {dialog && (
        <PantryDialog
          mode={dialog.mode}
          item={dialog.item}
          onClose={() => setDialog(null)}
          onSubmit={save}
        />
      )}

      {deleting && (
        <DeleteDialog
          item={deleting}
          busy={busyDelete}
          onCancel={() => setDeleting(null)}
          onConfirm={remove}
        />
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen p-3 sm:p-8">
      <div className="mx-auto min-h-[760px] max-w-lg rounded-[2.5rem] border-[6px] border-[#203a2e] bg-[#faf8f1] p-5 shadow-2xl sm:p-7">
        {children}
      </div>
    </div>
  );
}







