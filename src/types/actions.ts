/** Action catalog shapes from GET /action/catalog */

export type ActionGroup =
  | "shared"
  | "property_progress"
  | "demand_outcome"
  | "supply_outcome"
  | "broker"
  | string;

export interface ActionSpec {
  key: string;
  value: string;
  label: string;
  group: ActionGroup;
  owner_types: string[];
  terminal: boolean;
  requires_meeting_time: boolean;
  ai_assignable: boolean;
}

export interface FilterOnlyAction {
  key: string;
  value: string;
}

export interface ActionCatalog {
  actions: ActionSpec[];
  by_owner_type: Record<string, string[]>;
  filter_only: FilterOnlyAction[];
}

/** API action string, e.g. "Make a call" */
export type ActionValue = string;

export interface ActionOption {
  value: ActionValue;
  label: string;
  key?: string;
  terminal?: boolean;
  requires_meeting_time?: boolean;
}
