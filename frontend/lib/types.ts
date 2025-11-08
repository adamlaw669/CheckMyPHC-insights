// PHC (Primary Health Center) Types
export interface PHC {
  id: string;
  name?: string;
  "Name of Primary Health Center"?: string;
  "PHC Name"?: string;
  "PHC LGA"?: string;
  lga?: string;
  "State of PHC"?: string;
  state?: string;
  lat?: number;
  lon?: number;
  latitude?: number;
  longitude?: number;
  shortage_score?: number;
  alert_level?: string;
  underserved_index?: number;
  underserved_flag?: boolean;
  resource_risk_score?: number;
  malaria_cases?: number;
  previous_cases?: number;
  maternal_visits?: number;
  drug_stock_level?: number;
  staff_count?: number;
  population_served?: number;
  [key: string]: any; // Allow additional properties
}

// Outbreak Alert Types
export interface OutbreakAlert extends PHC {
  id: string;
  name: string;
  malaria_cases: number;
  previous_cases: number;
  shortage_score: number;
  alert_level: string;
}

// Underserved Response Types
export interface UnderservedResponse {
  summary: {
    total_phcs: number;
    top_n: number;
    state_filter: string;
  };
  data: PHC[];
}

// Alert Feed Item Types
export interface AlertFeedItem {
  id: string;
  phc_id: string;
  phc_name: string;
  phc_lga: string;
  phc_state: string;
  alert_type: string;
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  timestamp: string;
  read?: boolean;
  lat?: number;
  lon?: number;
}

// Simulated Alert Types
export interface SimulatedAlert {
  id: string;
  phc_id: string;
  phc_name: string;
  phc_lga: string;
  phc_state: string;
  alert_type: "outbreak" | "resource" | "underserved";
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  timestamp: string;
}

// API Parameters
export interface ApiParams {
  top_n?: number;
  state?: string;
  min_score?: number;
  limit?: number;
  offset?: number;
  [key: string]: any;
}

// API Error Types
export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

// Telecom Advice Types
export interface TelecomAdvice {
  phc_id: string;
  phc_name: string;
  network_quality: string;
  recommended_provider: string;
  signal_strength: number;
  advice: string;
}

// Metrics Types
export interface MetricsSummary {
  total_phcs: number;
  total_alerts: number;
  outbreak_alerts: number;
  resource_warnings: number;
  underserved_count: number;
  average_score: number;
}

// Ranking Types
export interface RankingItem {
  rank: number;
  phc_id: string;
  phc_name: string;
  phc_state: string;
  score: number;
  category: string;
}

// Trend Types
export interface TrendData {
  date: string;
  value: number;
  category: string;
}

// Map Marker Types
export interface MapMarker {
  id: string;
  position: [number, number];
  phc: PHC;
  color: string;
  size: number;
}

// Filter Types
export interface FilterOptions {
  states: string[];
  lgas: string[];
  alertTypes: string[];
  severityLevels: string[];
}

// Dashboard State Types
export interface DashboardState {
  selectedState: string | null;
  selectedLGA: string | null;
  dateRange: [Date, Date] | null;
  activeFilters: string[];
}
