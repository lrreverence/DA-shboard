export type FhiRow = {
  scam_type: string;
  avg_fhi: number;
  total_cases: number;
  years_present: string;
  rank: number;
  avg_loss_per_victim_php: number;
};

export type MasterRow = {
  year: number;
  scam_type: string;
  case_count: number;
  total_cases_year: number;
  prevalence_weight: number;
  avg_loss_per_victim_php: number;
  loss_data_type: string;
  total_loss_php_est: number;
  fhi_score: number;
  source_cases: string;
  avg_loss_source: string;
};

export type PlatformLossRow = {
  platform: string;
  total_loss_php: number;
  year: number;
  source: string;
};

export type DemographicFindingRow = {
  category: string;
  segment: string;
  finding: string;
  source: string;
};

export type DashboardPayload = {
  fhiRanking: FhiRow[];
  master: MasterRow[];
  platformLosses: PlatformLossRow[];
  demographics: DemographicFindingRow[];
};
