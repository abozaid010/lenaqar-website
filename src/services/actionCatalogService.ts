import { axiosInstance } from "@/lib/axiosInstance";
import type {
  ActionCatalog,
  ActionSpec,
  ActionValue,
} from "@/types/actions";

const CACHE_KEY = "action_catalog";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

type CachePayload = {
  data: ActionCatalog;
  timestamp: number;
};

class ActionCatalogService {
  private catalog: ActionCatalog | null = null;
  private lastFetchTime: number | null = null;
  private inflight: Promise<ActionCatalog> | null = null;

  async getCatalog(): Promise<ActionCatalog> {
    const cached = this.getFromCache();
    if (cached) {
      this.catalog = cached;
      return cached;
    }

    if (this.inflight) return this.inflight;

    this.inflight = this.fetchCatalog()
      .finally(() => {
        this.inflight = null;
      });

    return this.inflight;
  }

  /**
   * Sync snapshot for display helpers after catalog has loaded (or from cache).
   * Returns null when nothing is available yet.
   */
  getCatalogSync(): ActionCatalog | null {
    if (this.catalog) return this.catalog;
    return this.getFromCacheIgnoringTTL();
  }

  async getActionByValue(value: ActionValue): Promise<ActionSpec | null> {
    const catalog = await this.getCatalog();
    return this.findActionByValue(catalog, value);
  }

  getActionByValueSync(value: ActionValue): ActionSpec | null {
    const catalog = this.getCatalogSync();
    if (!catalog) return null;
    return this.findActionByValue(catalog, value);
  }

  /**
   * Values allowed for an owner type (shared + type-specific via by_owner_type).
   * When ownerType is null/undefined, returns all catalog action values.
   */
  async getActionsForOwnerType(
    ownerType?: string | null
  ): Promise<ActionValue[]> {
    const catalog = await this.getCatalog();
    return this.resolveOwnerTypeValues(catalog, ownerType);
  }

  getActionsForOwnerTypeSync(ownerType?: string | null): ActionValue[] {
    const catalog = this.getCatalogSync();
    if (!catalog) return [];
    return this.resolveOwnerTypeValues(catalog, ownerType);
  }

  /**
   * Intersection of actions valid for every owner type (plus shared via each list).
   * Empty ownerTypes → all actions.
   */
  getActionsForOwnerTypesSync(ownerTypes?: Array<string | null | undefined>): ActionValue[] {
    const catalog = this.getCatalogSync();
    if (!catalog) return [];

    const normalized = (ownerTypes || [])
      .map((t) => (t == null ? "" : String(t).trim().toLowerCase()))
      .filter(Boolean);

    if (normalized.length === 0) {
      return catalog.actions.map((a) => a.value);
    }

    const unique = [...new Set(normalized)];
    if (unique.length === 1) {
      return this.resolveOwnerTypeValues(catalog, unique[0]);
    }

    const lists = unique.map((t) => new Set(this.resolveOwnerTypeValues(catalog, t)));
    return [...lists[0]].filter((value) => lists.every((set) => set.has(value)));
  }

  async isTerminalAction(value: ActionValue): Promise<boolean> {
    const action = await this.getActionByValue(value);
    return action?.terminal ?? false;
  }

  async requiresMeetingTime(value: ActionValue): Promise<boolean> {
    const action = await this.getActionByValue(value);
    return action?.requires_meeting_time ?? false;
  }

  isTerminalActionSync(value: ActionValue): boolean {
    return this.getActionByValueSync(value)?.terminal ?? false;
  }

  requiresMeetingTimeSync(value: ActionValue): boolean {
    return this.getActionByValueSync(value)?.requires_meeting_time ?? false;
  }

  /** Actions that require a meeting time (schedule calendar subset). */
  getScheduledActionValuesSync(): ActionValue[] {
    const catalog = this.getCatalogSync();
    if (!catalog) return [];
    return catalog.actions
      .filter((a) => a.requires_meeting_time)
      .map((a) => a.value);
  }

  getFilterOnlyValuesSync(): ActionValue[] {
    const catalog = this.getCatalogSync();
    if (!catalog) return [];
    return (catalog.filter_only || []).map((item) => item.value);
  }

  async refreshCatalog(): Promise<ActionCatalog> {
    this.clearCache();
    this.catalog = null;
    this.lastFetchTime = null;
    return this.getCatalog();
  }

  private async fetchCatalog(): Promise<ActionCatalog> {
    try {
      const response = await axiosInstance.get("action/catalog");
      const body = response.data;

      if (!body?.status || !body?.data) {
        throw new Error(body?.message || "Failed to load action catalog");
      }

      const data = body.data as ActionCatalog;
      this.catalog = data;
      this.lastFetchTime = Date.now();
      this.saveToCache(data);
      return data;
    } catch (error) {
      const stale = this.getFromCacheIgnoringTTL();
      if (stale) {
        console.warn(
          "Failed to fetch fresh action catalog, using stale cache:",
          error
        );
        this.catalog = stale;
        return stale;
      }
      throw error instanceof Error
        ? error
        : new Error("Cannot load action catalog");
    }
  }

  private findActionByValue(
    catalog: ActionCatalog,
    value: ActionValue
  ): ActionSpec | null {
    if (value == null) return null;
    const trimmed = String(value).trim();
    if (!trimmed) return null;

    const fromActions =
      catalog.actions.find((a) => a.value === trimmed) || null;
    if (fromActions) return fromActions;

    const filterOnly = (catalog.filter_only || []).find(
      (a) => a.value === trimmed
    );
    if (filterOnly) {
      return {
        key: filterOnly.key,
        value: filterOnly.value,
        label: filterOnly.value,
        group: "filter_only",
        owner_types: [],
        terminal: false,
        requires_meeting_time: false,
        ai_assignable: false,
      };
    }

    return null;
  }

  private resolveOwnerTypeValues(
    catalog: ActionCatalog,
    ownerType?: string | null
  ): ActionValue[] {
    if (!ownerType) {
      return catalog.actions.map((a) => a.value);
    }

    const key = String(ownerType).trim().toLowerCase();
    const fromMap = catalog.by_owner_type?.[key];
    if (Array.isArray(fromMap) && fromMap.length > 0) {
      return fromMap;
    }

    // Fallback: shared (empty owner_types) + matching owner_types
    return catalog.actions
      .filter(
        (a) =>
          !a.owner_types?.length ||
          a.owner_types.some((t) => String(t).toLowerCase() === key)
      )
      .map((a) => a.value);
  }

  private getFromCache(): ActionCatalog | null {
    if (typeof window === "undefined") return null;

    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    try {
      const { data, timestamp } = JSON.parse(cached) as CachePayload;
      if (!data?.actions || !Array.isArray(data.actions)) {
        this.clearCache();
        return null;
      }
      if (Date.now() - timestamp > CACHE_TTL_MS) {
        this.clearCache();
        return null;
      }
      this.lastFetchTime = timestamp;
      return data;
    } catch {
      this.clearCache();
      return null;
    }
  }

  private getFromCacheIgnoringTTL(): ActionCatalog | null {
    if (typeof window === "undefined") return null;

    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    try {
      const { data } = JSON.parse(cached) as CachePayload;
      if (!data?.actions || !Array.isArray(data.actions)) return null;
      return data;
    } catch {
      return null;
    }
  }

  private saveToCache(catalog: ActionCatalog): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({
          data: catalog,
          timestamp: Date.now(),
        } satisfies CachePayload)
      );
    } catch (error) {
      console.warn("Failed to cache action catalog:", error);
    }
  }

  private clearCache(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(CACHE_KEY);
  }
}

export const actionCatalogService = new ActionCatalogService();
