import axios, { AxiosError } from "axios";
import type {
  OutbreakAlert,
  UnderservedResponse,
  AlertFeedItem,
  TelecomAdvice,
  ApiParams,
  ApiError,
  PHC,
  TopUnderservedPHC,
} from "./types";

// Get API base URL from environment or default
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://presight-gcc2.onrender.com/api/v1";

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Error handler
function handleApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ detail?: string; message?: string }>;
    return {
      message:
        axiosError.response?.data?.detail ||
        axiosError.response?.data?.message ||
        axiosError.message ||
        "An error occurred",
      status: axiosError.response?.status,
      code: axiosError.code,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
    };
  }

  return {
    message: "An unknown error occurred",
  };
}

// ----------------------------------------------------------------------------
// Normalisation helpers
// ----------------------------------------------------------------------------

const ALERT_TYPE_MAP: Record<string, string> = {
  "outbreak alert": "outbreak",
  outbreak: "outbreak",
  "resource risk": "resource",
  resource: "resource",
  "resource warning": "resource",
  warning: "resource",
  "underserved facility": "underserved",
  underserved: "underserved",
  connectivity: "connectivity",
};

const ALERT_TYPE_LABEL: Record<string, string> = {
  outbreak: "Outbreak Alert",
  resource: "Resource Warning",
  underserved: "Underserved Facility",
  connectivity: "Connectivity Alert",
};

function toStringValue(value: unknown, fallback = ""): string {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "string") return value.trim();
  return String(value);
}

function toNumberValue(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function toBooleanValue(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") {
    if (value === 1) return true;
    if (value === 0) return false;
  }
  if (typeof value === "string") {
    const normalised = value.trim().toLowerCase();
    if (["true", "1", "yes", "y"].includes(normalised)) return true;
    if (["false", "0", "no", "n"].includes(normalised)) return false;
  }
  return fallback;
}

function ensureTimestamp(value: unknown): string {
  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  return new Date().toISOString();
}

function deriveAlertLevel(score: number): "Low" | "Medium" | "High" {
  if (score >= 3) return "High";
  if (score >= 2) return "Medium";
  if (score >= 1) return "Low";
  return "Low";
}

function normalisePHCRecord(record: any, index: number): PHC {
  const displayName =
    toStringValue(
      record?.display_name ??
        record?.displayName ??
        record?.["Name of Primary Health Center"] ??
        record?.["Name of Primary Health Centre"] ??
        record?.["PHC Name"] ??
        record?.phc_name ??
        record?.name ??
        `PHC ${index + 1}`
    ) || `PHC ${index + 1}`;

  const normalizedName = toStringValue(
    record?.name ?? record?.phc_name ?? displayName.toLowerCase()
  ).toLowerCase();

  const lga = toStringValue(
    record?.lga ?? record?.["PHC LGA"] ?? record?.phc_lga ?? ""
  );

  const state = toStringValue(
    record?.state ?? record?.["State of PHC"] ?? record?.phc_state ?? ""
  );

  const underservedIndex =
    record?.underserved_index ?? record?.underservedIndex ?? record?.index;

  const shortageScore =
    record?.shortage_score ?? record?.shortageScore ?? record?.score;

  return {
    ...record,
    id: toStringValue(record?.id ?? normalizedName ?? `phc_${index}`),
    name: normalizedName || displayName.toLowerCase(),
    display_name: displayName,
    "Name of Primary Health Center": displayName,
    "PHC Name": displayName,
    lga,
    "PHC LGA": lga,
    state,
    "State of PHC": state,
    underserved_index:
      underservedIndex !== undefined
        ? Number.parseFloat(String(underservedIndex)) || 0
        : record?.underserved_index,
    underserved_flag: toBooleanValue(
      record?.underserved_flag ?? record?.underserved,
      false
    ),
    shortage_score:
      shortageScore !== undefined
        ? Number.parseFloat(String(shortageScore)) || 0
        : record?.shortage_score,
  };
}

function mapTopUnderserved(
  data: PHC[],
  summary: any,
  limit = 5
): TopUnderservedPHC[] {
  const rawTop = Array.isArray(summary?.top_underserved_phcs)
    ? summary.top_underserved_phcs
    : Array.isArray(summary?.top)
    ? summary.top
    : Array.isArray(summary?.top_n)
    ? summary.top_n
    : [];

  const normalisedTop = rawTop
    .map((item: any, idx: number) => {
      const displayName =
        toStringValue(
          item?.display_name ??
            item?.name ??
            item?.phc_name ??
            `Top PHC ${idx + 1}`
        ) || `Top PHC ${idx + 1}`;

      return {
        name:
          toStringValue(item?.name ?? item?.phc_name ?? displayName).toLowerCase() ||
          displayName.toLowerCase(),
        display_name: displayName,
        underserved_index: toNumberValue(item?.underserved_index, 0),
      };
    })
    .filter(Boolean) as TopUnderservedPHC[];

  if (normalisedTop.length > 0) {
    return normalisedTop;
  }

  return [...data]
    .filter((phc) => typeof phc.underserved_index === "number")
    .sort(
      (a, b) =>
        (b.underserved_index ?? 0) - (a.underserved_index ?? 0)
    )
    .slice(0, limit)
    .map((phc) => ({
      name: toStringValue(phc.name ?? phc.display_name ?? "").toLowerCase(),
      display_name: toStringValue(
        phc.display_name ??
          phc["Name of Primary Health Center"] ??
          phc.name ??
          "Unknown PHC"
      ),
      underserved_index: phc.underserved_index ?? 0,
    }));
}

function normaliseAlertType(type: unknown): string {
  const raw = toStringValue(type, "").toLowerCase();
  return ALERT_TYPE_MAP[raw] ?? (raw || "alert");
}

function getTypeLabel(type: string): string {
  return ALERT_TYPE_LABEL[type] ?? type.charAt(0).toUpperCase() + type.slice(1);
}

export function normalizeOutbreakAlerts(payload: unknown): OutbreakAlert[] {
  const recordsSource =
    Array.isArray((payload as any)?.data) ? (payload as any).data : payload;

  const records = Array.isArray(recordsSource) ? recordsSource : [];

  return records.map((record, index) => {
    const base = normalisePHCRecord(record, index);
    const shortageScore = toNumberValue(base.shortage_score ?? 0, 0);
    const alertLevel = toStringValue(
      record?.alert_level ?? record?.alertLevel ?? base.alert_level,
      ""
    );

    return {
      ...base,
      id: base.id ?? `outbreak_${index}`,
      name:
        base.name ??
        base.display_name?.toLowerCase() ??
        `outbreak_${index}`,
      display_name:
        base.display_name ?? base["Name of Primary Health Center"],
      shortage_score: shortageScore,
      alert_level: alertLevel
        ? (alertLevel.charAt(0).toUpperCase() + alertLevel.slice(1).toLowerCase()) as
            | "Low"
            | "Medium"
            | "High"
        : deriveAlertLevel(shortageScore),
    };
  });
}

export function normalizeUnderservedResponse(
  payload: unknown
): UnderservedResponse {
  const dataSource =
    Array.isArray((payload as any)?.data) ? (payload as any).data : payload;

  const phcData = Array.isArray(dataSource) ? dataSource : [];

  const normalizedData = phcData.map((record, index) => {
    const base = normalisePHCRecord(record, index);
    return {
      ...base,
      underserved_index: toNumberValue(
        record?.underserved_index ?? base.underserved_index,
        0
      ),
      underserved_flag: toBooleanValue(
        record?.underserved_flag ?? base.underserved_flag,
        false
      ),
    };
  });

  const summary = (payload as any)?.summary ?? {};

  const avgUnderserved =
    typeof summary?.avg_underserved_index === "number"
      ? summary.avg_underserved_index
      : normalizedData.length > 0
      ? Number(
          (
            normalizedData.reduce(
              (acc, phc) => acc + (phc.underserved_index ?? 0),
              0
            ) / normalizedData.length
          ).toFixed(3)
        )
      : 0;

  const topUnderserved = mapTopUnderserved(normalizedData, summary);

  return {
    summary: {
      avg_underserved_index: Number(avgUnderserved.toFixed(3)),
      top_underserved_phcs: topUnderserved,
    },
    count:
      typeof (payload as any)?.count === "number"
        ? (payload as any).count
        : normalizedData.length,
    data: normalizedData,
  };
}

export function normalizeAlertsFeed(payload: unknown): AlertFeedItem[] {
  const feedSource = Array.isArray((payload as any)?.feed)
    ? (payload as any).feed
    : payload;

  const feed = Array.isArray(feedSource) ? feedSource : [];

  return feed.map((item, index) => {
    const type = normaliseAlertType(
      item?.type ?? item?.alert_type ?? item?.category
    );
    const label = getTypeLabel(type);

    const displayName =
      toStringValue(
        item?.display_name ??
          item?.phc_name ??
          item?.phc ??
          `PHC ${index + 1}`
      ) || `PHC ${index + 1}`;

    const lga = toStringValue(
      item?.lga ?? item?.phc_lga ?? item?.LGA ?? ""
    );
    const state = toStringValue(
      item?.state ?? item?.phc_state ?? item?.State ?? ""
    );

    const scoreValue =
      item?.score !== undefined
        ? toNumberValue(item?.score, NaN)
        : toNumberValue(item?.risk_score ?? item?.value, NaN);

    const levelValue = toStringValue(
      item?.level ?? item?.severity ?? ""
    );

    return {
      id: toStringValue(
        item?.id ?? `${type}_${index}_${displayName.replace(/\s+/g, "_")}`
      ),
      phc: displayName,
      phcName: displayName,
      phc_id: toStringValue(item?.phc_id ?? item?.phcId ?? ""),
      phc_name: toStringValue(
        item?.phc_name ?? item?.phc ?? displayName
      ),
      display_name: displayName,
      lga,
      phc_lga: lga,
      state,
      phc_state: state,
      type,
      alert_type: label,
      level: levelValue
        ? levelValue.charAt(0).toUpperCase() + levelValue.slice(1)
        : undefined,
      score: Number.isFinite(scoreValue) ? scoreValue : undefined,
      severity: undefined,
      message:
        toStringValue(item?.message ?? item?.description ?? "") ||
        `${label} reported at ${displayName}`,
      timestamp: ensureTimestamp(item?.timestamp),
      channel: toStringValue(
        item?.channel ?? item?.source ?? (item?.simulated ? "Simulated" : "API"),
        item?.simulated ? "Simulated" : "API"
      ),
      simulated: Boolean(item?.simulated),
    };
  });
}

function normalizeTelecomAdvice(payload: unknown): TelecomAdvice[] {
  const source =
    Array.isArray((payload as any)?.data) ? (payload as any).data : payload;
  const records = Array.isArray(source) ? source : [];

  return records.map((item: any, index: number) => ({
    phc_id: toStringValue(
      item?.phc_id ?? item?.id ?? item?.name ?? `telecom_${index}`
    ),
    phc_name: toStringValue(
      item?.display_name ?? item?.phc_name ?? item?.name ?? `PHC ${index + 1}`
    ),
    network_quality: toStringValue(
      item?.network_quality ?? item?.telecom_notes ?? ""
    ),
    recommended_provider: toStringValue(
      item?.recommended_provider ?? item?.preferred_provider ?? ""
    ),
    signal_strength: toNumberValue(item?.signal_strength, 0),
    advice:
      toStringValue(item?.advice) ||
      `Preferred channel: ${toStringValue(
        item?.preferred_channel ?? "SMS"
      )}`,
  }));
}

// ----------------------------------------------------------------------------
// API Functions
// ----------------------------------------------------------------------------

export async function getOutbreakAlerts(
  params?: ApiParams
): Promise<OutbreakAlert[]> {
  try {
    const response = await apiClient.get("/outbreak-alerts", {
      params,
    });
    return normalizeOutbreakAlerts(response.data);
  } catch (error) {
    console.error("Error fetching outbreak alerts:", error);
    throw handleApiError(error);
  }
}

export async function getUnderserved(
  params?: ApiParams
): Promise<UnderservedResponse> {
  try {
    const response = await apiClient.get("/underserved", {
      params,
    });
    return normalizeUnderservedResponse(response.data);
  } catch (error) {
    console.error("Error fetching underserved PHCs:", error);
    throw handleApiError(error);
  }
}

export async function getAlertsFeed(
  params?: ApiParams
): Promise<AlertFeedItem[]> {
  try {
    const response = await apiClient.get("/alerts-feed", {
      params,
    });
    return normalizeAlertsFeed(response.data);
  } catch (error) {
    console.error("Error fetching alerts feed:", error);
    throw handleApiError(error);
  }
}

export async function getTelecomAdvice(
  phcName: string,
  params?: ApiParams
): Promise<{ count: number; data: TelecomAdvice[] }> {
  try {
    const response = await apiClient.get("/telecom-advice", {
      params: { ...params, name: phcName },
    });

    const normalized = normalizeTelecomAdvice(response.data);
    return {
      count: normalized.length,
      data: normalized,
    };
  } catch (error) {
    console.error("Error fetching telecom advice:", error);
    throw handleApiError(error);
  }
}

export async function getResourceWarnings(
  params?: ApiParams
): Promise<any[]> {
  try {
    const response = await apiClient.get("/resource-warnings", {
      params,
    });
    const data = Array.isArray(response.data?.data)
      ? response.data.data
      : Array.isArray(response.data)
      ? response.data
      : [];
    return data;
  } catch (error) {
    console.error("Error fetching resource warnings:", error);
    throw handleApiError(error);
  }
}

export async function getMetricsSummary(params?: ApiParams): Promise<any> {
  try {
    const response = await apiClient.get("/metrics-summary", {
      params,
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching metrics summary:", error);
    throw handleApiError(error);
  }
}

export async function healthCheck(): Promise<{ status: string; message: string }> {
  try {
    const response = await apiClient.get<{ status: string; message: string }>(
      "/health"
    );
    return response.data;
  } catch (error) {
    console.error("Error checking API health:", error);
    throw handleApiError(error);
  }
}

// Export the axios instance and normalisers for reuse
export { apiClient };
