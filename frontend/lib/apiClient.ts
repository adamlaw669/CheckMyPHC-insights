import axios, { AxiosError } from "axios";
import type {
  OutbreakAlert,
  UnderservedResponse,
  AlertFeedItem,
  TelecomAdvice,
  ApiParams,
  ApiError,
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

// API Functions

/**
 * Fetch outbreak alerts
 */
export async function getOutbreakAlerts(
  params?: ApiParams
): Promise<OutbreakAlert[]> {
  try {
    const response = await apiClient.get<OutbreakAlert[]>("/outbreak-alerts", {
      params,
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching outbreak alerts:", error);
    throw handleApiError(error);
  }
}

/**
 * Fetch underserved PHCs
 */
export async function getUnderserved(
  params?: ApiParams
): Promise<UnderservedResponse> {
  try {
    const response = await apiClient.get<UnderservedResponse>("/underserved", {
      params,
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching underserved PHCs:", error);
    throw handleApiError(error);
  }
}

/**
 * Fetch alerts feed
 */
export async function getAlertsFeed(
  params?: ApiParams
): Promise<AlertFeedItem[]> {
  try {
    const response = await apiClient.get<AlertFeedItem[]>("/alerts-feed", {
      params,
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching alerts feed:", error);
    throw handleApiError(error);
  }
}

/**
 * Fetch telecom advice for a PHC
 */
export async function getTelecomAdvice(
  phcName: string,
  params?: ApiParams
): Promise<any> {
  try {
    const response = await apiClient.get<{ count: number; data: any[] }>(
      `/telecom-advice`,
      { params: { ...params, name: phcName } }
    );
    return response.data; // Return full response with count and data
  } catch (error) {
    console.error("Error fetching telecom advice:", error);
    throw handleApiError(error);
  }
}

/**
 * Fetch resource warnings
 */
export async function getResourceWarnings(
  params?: ApiParams
): Promise<any[]> {
  try {
    const response = await apiClient.get<{ count: number; data: any[] }>("/resource-warnings", {
      params,
    });
    return response.data.data; // Extract data array from response
  } catch (error) {
    console.error("Error fetching resource warnings:", error);
    throw handleApiError(error);
  }
}

/**
 * Fetch metrics summary
 */
export async function getMetricsSummary(params?: ApiParams): Promise<any> {
  try {
    const response = await apiClient.get<{ count: number; data: any[] }>("/metrics-summary", { params });
    return response.data; // Return full response with count and data
  } catch (error) {
    console.error("Error fetching metrics summary:", error);
    throw handleApiError(error);
  }
}

/**
 * Health check
 */
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

// Export the axios instance for custom requests
export { apiClient };
