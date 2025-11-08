"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { PHC, SimulatedAlert, AlertFeedItem } from "../lib/types";
import { loadSimulatedAlerts, sendSimulatedAlert } from "../lib/utils";

interface AlertContextType {
  selectedAlert: AlertFeedItem | null;
  setSelectedAlert: (alert: AlertFeedItem | null) => void;
  simulatedAlerts: SimulatedAlert[];
  sendAlert: (phc: PHC, type: "outbreak" | "resource" | "underserved") => Promise<void>;
  clearAlerts: () => void;
  isLoading: boolean;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [selectedAlert, setSelectedAlert] = useState<AlertFeedItem | null>(null);
  const [simulatedAlerts, setSimulatedAlerts] = useState<SimulatedAlert[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load simulated alerts from localStorage on mount
  useEffect(() => {
    setSimulatedAlerts(loadSimulatedAlerts());

    // Listen for alert events
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

  const sendAlert = useCallback(
    async (phc: PHC, type: "outbreak" | "resource" | "underserved") => {
      setIsLoading(true);
      try {
        await sendSimulatedAlert(phc, type);
        // Alerts are automatically updated via event listeners
      } catch (error) {
        console.error("Error sending alert:", error);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const clearAlerts = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("simulatedAlerts");
      window.dispatchEvent(new Event("alertsCleared"));
    }
  }, []);

  return (
    <AlertContext.Provider
      value={{
        selectedAlert,
        setSelectedAlert,
        simulatedAlerts,
        sendAlert,
        clearAlerts,
        isLoading,
      }}
    >
      {children}
    </AlertContext.Provider>
  );
}

export function useAlertContext() {
  const context = useContext(AlertContext);
  if (context === undefined) {
    throw new Error("useAlertContext must be used within an AlertProvider");
  }
  return context;
}
