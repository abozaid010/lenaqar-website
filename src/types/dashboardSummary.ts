export interface DashboardSummaryActionsByType {
  [actionType: string]: number;
}

export interface DashboardSummaryData {
  start_date: string;
  end_date: string;
  client_id?: string;
  total_leads: number;
  new_users_count: number;
  updated_users_count: number;
  units_shared_count: number;
  pending_approval_units_count: number;
  units_added_count: number;
  units_sold_count: number;
  units_rented_count: number;
  actions_by_type: DashboardSummaryActionsByType;
  actions_total: number;
  narrative: string;
}

export interface FetchDashboardSummaryOptions {
  startDate: string;
  endDate: string;
  refresh?: boolean;
}
