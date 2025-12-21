export interface UserStats {
  total: number;
}

export interface DeviceStats {
  total: number;
  available: number;
  borrowed: number;
}

export interface LoanStats {
  total: number;
  active: number;
  returned: number;
}

export interface DashboardSummary {
  users: UserStats;
  devices: DeviceStats;
  loans: LoanStats;
}
