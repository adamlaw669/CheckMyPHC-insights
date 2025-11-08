// Custom SWR hooks for API data fetching

import useSWR, { mutate } from "swr";
import type {
  OutbreakAlert,
  UnderservedResponse,
  AlertFeedItem,
  ApiParams,
  ApiError,
} from "../lib/types";
import {
  getOutbreakAlerts,
  getUnderserved,
  getAlertsFeed,
  getTelecomAdvice,
} from "../lib/apiClient";
import { loadSimulatedAlerts } from "../lib/utils";
import { useEffect, useMemo, useState } from "react";
import {
  normalizeOutbreakAlerts,
  normalizeUnderservedResponse,
  normalizeAlertsFeed,
} from "../lib/apiClient";

// Import mock data as fallback
import mockOutbreakAlerts from "../mocks/sample_outbreak_alerts.json";
import mockUnderserved from "../mocks/sample_underserved_phcs.json";

/**
 * Hook to fetch outbreak alerts with SWR
 */
export function useOutbreakAlerts(params: ApiParams = {}) {
  const [useMock, setUseMock] = useState(false);
  
  const { data, error, isLoading, mutate: refetch } = useSWR<OutbreakAlert[] | unknown, ApiError>(
    ["outbreakAlerts", params],
    () => getOutbreakAlerts(params),
    {
      revalidateOnFocus: false,
      refreshInterval: 30000, // Refresh every 30 seconds
      onError: (err) => {
        console.warn("API error, using mock data:", err);
        setUseMock(true);
      },
    }
  );
  
  const normalizedData = useMemo(
    () => normalizeOutbreakAlerts(data),
    [data]
  );

  const fallbackData = useMemo(
    () => normalizeOutbreakAlerts(mockOutbreakAlerts as unknown),
    []
  );

  // Use mock data if API fails
  const finalData = useMock || error ? fallbackData : normalizedData;
  
  return {
    data: finalData,
    error: useMock ? null : error,
    isLoading,
    refetch,
    usingMockData: useMock || !!error,
  };
}

/**
 * Hook to fetch underserved PHCs with SWR
 */
export function useUnderserved(params: ApiParams = {}) {
  const [useMock, setUseMock] = useState(false);
  
  const { data, error, isLoading, mutate: refetch } = useSWR<UnderservedResponse | unknown, ApiError>(
    ["underserved", params],
    () => getUnderserved(params),
    {
      revalidateOnFocus: false,
      refreshInterval: 60000, // Refresh every 60 seconds
      onError: (err) => {
        console.warn("API error, using mock data:", err);
        setUseMock(true);
      },
    }
  );
  
  const normalizedData = useMemo(
    () => (data ? normalizeUnderservedResponse(data) : undefined),
    [data]
  );

  const fallbackData = useMemo(
    () => normalizeUnderservedResponse(mockUnderserved as unknown),
    []
  );

  // Use mock data if API fails
  const finalData = useMock || error ? fallbackData : normalizedData;
  
  return {
    data: finalData,
    error: useMock ? null : error,
    isLoading,
    refetch,
    usingMockData: useMock || !!error,
  };
}

/**
 * Hook to fetch alerts feed with SWR and polling
 */
export function useAlertsFeed(params: ApiParams = {}) {
  const [useMock, setUseMock] = useState(false);
  const [simulatedAlerts, setSimulatedAlerts] = useState<any[]>([]);
  
  const { data, error, isLoading, mutate: refetch } = useSWR<AlertFeedItem[] | unknown, ApiError>(
    ["alertsFeed", params],
    () => getAlertsFeed(params),
    {
      revalidateOnFocus: false,
      refreshInterval: 5000, // Poll every 5 seconds for real-time demo
      onError: (err) => {
        console.warn("API error for alerts feed:", err);
        setUseMock(true);
      },
    }
  );
  
  // Load simulated alerts from localStorage
  useEffect(() => {
    setSimulatedAlerts(loadSimulatedAlerts());
    
    // Listen for new simulated alerts
    const handleAlertSimulated = () => {
      setSimulatedAlerts(loadSimulatedAlerts());
    };
    
    const handleAlertsCleared = () => {
      setSimulatedAlerts([]);
    };
    
    window.addEventListener("alertSimulated", handleAlertSimulated);
    window.addEventListener("alertsCleared", handleAlertsCleared);
    
    return () => {
      window.removeEventListener("alertSimulated", handleAlertSimulated);
      window.removeEventListener("alertsCleared", handleAlertsCleared);
    };
  }, []);
  
  const normalizedApiAlerts = useMemo(
    () => normalizeAlertsFeed(data),
    [data]
  );

  const simulatedFeed = useMemo(
    () =>
      simulatedAlerts.map((alert) => {
        const type = (alert.alert_type || alert.type || "outbreak").toString().toLowerCase();
        return {
          id: alert.id,
          phc: alert.phc_name,
          phcName: alert.phc_name,
          phc_name: alert.phc_name,
          lga: alert.phc_lga,
          state: alert.phc_state,
          type,
          alert_type: type,
          level: alert.level || "High",
          message: alert.message,
          timestamp: alert.timestamp,
          simulated: true,
          channel: alert.channel || "Simulated",
        } satisfies AlertFeedItem;
      }),
    [simulatedAlerts]
  );

  const finalAlerts = useMock || error ? [] : normalizedApiAlerts;

  // Merge API data with simulated alerts
  const mergedData = [...simulatedFeed, ...finalAlerts];
  
  return {
    data: mergedData,
    error: useMock ? null : error,
    isLoading,
    refetch,
    usingMockData: useMock || !!error,
    hasSimulatedAlerts: simulatedAlerts.length > 0,
  };
}

/**
 * Hook to manage polling state
 */
export function usePolling(interval: number = 5000) {
  const [isPolling, setIsPolling] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  
  useEffect(() => {
    if (!isPolling) return;
    
    const timer = setInterval(() => {
      setLastUpdate(new Date());
    }, interval);
    
    return () => clearInterval(timer);
  }, [isPolling, interval]);
  
  const togglePolling = () => setIsPolling((prev) => !prev);
  
  return {
    isPolling,
    lastUpdate,
    togglePolling,
  };
}

/**
 * Manually refetch all dashboard data
 */
export function refetchAllData() {
  mutate((key) => Array.isArray(key) && typeof key[0] === "string");
}
